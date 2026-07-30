<?php
declare(strict_types=1);

/**
 * POST /api/cotizador-pdf.php
 * ------------------------------------------------------------------
 * Recibe una propuesta ya calculada (JSON) y devuelve el PDF binario.
 * Lo llama el workflow "Cotizador — Propuesta" de n8n; no lo usa la web.
 *
 * Autenticación: header  X-Cotizador-Key: <COTIZADOR_PDF_SECRET>
 * El secreto vive sólo en config/config.php del servidor (no se commitea).
 * Si no está definido, el endpoint responde 503 y no genera nada: preferimos
 * que falle a que quede abierto para que cualquiera nos queme CPU.
 *
 * Body esperado:
 * {
 *   "numero":"CL-2607-0042", "fecha":"28 de julio de 2026", "validez":"15 días",
 *   "servicio":"Automatizaciones e integraciones",
 *   "cliente":{"nombre":"","empresa":"","email":"","telefono":""},
 *   "mensaje":"texto libre",
 *   "modulos":[{"modulo":"","descripcion":"","categoria":"","cantidad":1,"horas":10,"subtotal":450000}],
 *   "horas":35, "valor_hora":45000, "total":1575000,
 *   "calendar":"https://calendar.app.google/...",
 *   "token":"a1b2c3d4e5f6"   // opcional, ver abajo
 * }
 *
 * Si viene "token", ademas de devolver el PDF lo guarda en
 * /propuestas/<numero>-<token>.pdf para que el email pueda ofrecer un boton
 * de "Descargar la propuesta". El token lo genera n8n y es lo unico que
 * hace la URL no adivinable, asi que nunca se loguea ni se muestra.
 * Guardar es best-effort: si falla, igual devolvemos el PDF (el adjunto del
 * mail es la via principal) y queda el error en el log de PHP.
 */

// Nada de warnings en la salida: corromperían el binario del PDF.
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE & ~E_WARNING);

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/propuesta-pdf.php';

/** Responde un error en JSON y corta. */
function fail(int $code, string $msg): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    fail(405, 'Sólo POST');
}

if (!defined('COTIZADOR_PDF_SECRET') || COTIZADOR_PDF_SECRET === '') {
    error_log('cotizador-pdf: falta COTIZADOR_PDF_SECRET en config/config.php');
    fail(503, 'Endpoint sin configurar');
}

$key = $_SERVER['HTTP_X_COTIZADOR_KEY'] ?? '';
if (!is_string($key) || !hash_equals(COTIZADOR_PDF_SECRET, $key)) {
    fail(401, 'No autorizado');
}

$raw = file_get_contents('php://input');
if ($raw === false || $raw === '' || strlen($raw) > 200000) {
    fail(400, 'Body vacío o demasiado grande');
}

try {
    $d = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    fail(400, 'JSON inválido');
}

if (!is_array($d) || empty($d['modulos']) || !is_array($d['modulos'])) {
    fail(422, 'Faltan los módulos de la propuesta');
}

try {
    $pdf = propuesta_pdf($d);
} catch (Throwable $e) {
    error_log('cotizador-pdf: ' . $e->getMessage());
    fail(500, 'No se pudo generar el PDF');
}

// Nombre de archivo legible para el adjunto del email.
$slug = preg_replace('/[^A-Za-z0-9_-]/', '', (string) ($d['numero'] ?? 'propuesta'));
$slug = $slug !== '' ? $slug : 'propuesta';
$name = 'Propuesta-ChichaLabs-' . $slug . '.pdf';

// Copia descargable, si n8n mando un token.
$token = preg_replace('/[^a-f0-9]/', '', strtolower((string) ($d['token'] ?? '')));
if (strlen($token) >= 12) {
    guardar_copia($slug, substr($token, 0, 32), $pdf);
}

/**
 * Deja el PDF en /propuestas/ para que el email pueda linkearlo.
 * $slug y $token ya vienen saneados a [A-Za-z0-9_-] y [a-f0-9], asi que no
 * hay forma de salir del directorio.
 */
function guardar_copia(string $slug, string $token, string $pdf): void
{
    $dir = dirname(__DIR__) . '/propuestas';
    if (!is_dir($dir) || !is_writable($dir)) {
        error_log('cotizador-pdf: /propuestas no existe o no es escribible');
        return;
    }
    if (file_put_contents($dir . '/' . $slug . '-' . $token . '.pdf', $pdf) === false) {
        error_log('cotizador-pdf: no se pudo guardar la copia de ' . $slug);
        return;
    }
    limpiar_viejas($dir);
}

/** Borra propuestas de mas de 180 dias para que la carpeta no crezca sola. */
function limpiar_viejas(string $dir): void
{
    $limite = time() - 180 * 86400;
    foreach (glob($dir . '/*.pdf') ?: [] as $f) {
        if (filemtime($f) < $limite) {
            @unlink($f);
        }
    }
}

header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="' . $name . '"');
header('Content-Length: ' . strlen($pdf));
header('X-Content-Type-Options: nosniff');
echo $pdf;
