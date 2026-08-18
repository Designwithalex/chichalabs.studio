<?php
declare(strict_types=1);

/**
 * POST /api/meta-capi.php
 * ------------------------------------------------------------------
 * Espeja del lado del servidor los eventos que el pixel manda desde el
 * browser (Conversions API). Lo llama el propio sitio, no n8n.
 *
 * POR QUÉ EXISTE
 * Los bloqueadores cortan connect.facebook.net y `fbq` queda sin definir:
 * ese evento no llega a Meta y no existe para la campaña. Con ~15 leads al
 * mes, perder 20-30% es la diferencia entre que la campaña aprenda o no.
 * Este endpoint es first-party (mismo dominio), así que los bloqueadores no
 * lo tocan y el evento llega igual.
 *
 * DEDUPLICACIÓN
 * El front manda el MISMO event_id por las dos vías (fbq eventID + este
 * endpoint). Meta los une y cuenta uno solo. Si el event_id no coincidiera,
 * cada lead se contaría dos veces y el CPL reportado sería la mitad del real.
 *
 * QUÉ NO HACE FALTA MANDAR DESDE EL JS
 * Al ser same-origin, el browser manda solo las cookies _fbp y _fbc, y PHP
 * ve la IP y el user-agent reales del visitante. Eso es justo lo que sube el
 * Event Match Quality, y sale gratis. El JS sólo agrega el email cuando lo
 * tiene (el cotizador), porque ese dato no viaja en ninguna cookie.
 *
 * Body esperado:
 * {
 *   "event_name":"Lead", "event_id":"a1b2c3…",
 *   "event_source_url":"https://chichalabs.studio/servicios/…",
 *   "custom_data":{"value":1170000,"currency":"ARS","content_ids":["…"]},
 *   "user_data":{"em":"persona@mail.com"}      // opcional, en claro; se hashea acá
 * }
 *
 * Responde siempre rápido y nunca rompe la web: el front lo llama
 * fire-and-forget e ignora la respuesta.
 */

ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE & ~E_WARNING);

require_once __DIR__ . '/../config/config.php';

const CAPI_API_VERSION = 'v21.0';

/**
 * Sólo estos eventos se aceptan. El endpoint es público por necesidad, así
 * que la allowlist evita que alguien nos ensucie el pixel con eventos
 * inventados que después arruinan los públicos y la optimización.
 */
const CAPI_EVENTOS = [
    'PageView', 'ViewContent', 'Lead', 'Schedule',
    'LandingEngaged', 'QuoteStarted', 'QuotePriced',
    'QuoteContactOpened', 'QuoteUnavailable',
    /* 2026-08-18 · señal dura y señal blanda separadas.
       LeadCalificado  = envío del cotizador confirmado por el backend. Es el
                         evento contra el que tiene que optimizar la campaña.
       ContactoIniciado = click a WhatsApp. Antes disparaba `Lead` y con un
                         solo toque valía una conversión: es lo que dejó a
                         Meta comprando toques accidentales en Audience
                         Network. Ahora es diagnóstico, no optimización. */
    'LeadCalificado', 'ContactoIniciado',
];

/** Corta con un JSON. El front no lo mira, pero sirve para debuggear a mano. */
function done(int $code, string $msg): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => $code < 400, 'msg' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    done(405, 'Sólo POST');
}

/* Falla cerrado, igual que cotizador-pdf.php: sin token no mandamos nada. */
if (!defined('META_CAPI_TOKEN') || META_CAPI_TOKEN === ''
    || !defined('META_PIXEL_ID') || META_PIXEL_ID === '') {
    error_log('meta-capi: falta META_CAPI_TOKEN o META_PIXEL_ID en config/config.php');
    done(503, 'Endpoint sin configurar');
}

/*
 * El Origin tiene que ser nuestro. No es una defensa fuerte (se falsifica con
 * curl), pero corta el abuso casual desde otra página sin pedirle nada al
 * visitante legítimo. La defensa real es la allowlist de eventos de arriba.
 */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && stripos($origin, parse_url(SITE_BASE_URL, PHP_URL_HOST) ?: 'chichalabs.studio') === false) {
    done(403, 'Origen no permitido');
}

$raw = file_get_contents('php://input');
if ($raw === false || $raw === '' || strlen($raw) > 20000) {
    done(400, 'Body vacío o demasiado grande');
}

try {
    $d = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    done(400, 'JSON inválido');
}

$evento = (string) ($d['event_name'] ?? '');
if (!in_array($evento, CAPI_EVENTOS, true)) {
    done(422, 'Evento no permitido');
}

$eventId = preg_replace('/[^A-Za-z0-9_-]/', '', (string) ($d['event_id'] ?? ''));
if ($eventId === '' || strlen($eventId) > 64) {
    done(422, 'Falta event_id');   // sin esto Meta contaría el lead dos veces
}

/* ── user_data ────────────────────────────────────────────────────────
   Meta exige SHA-256 sobre el valor normalizado (minúsculas, sin espacios).
   fbp/fbc van SIN hashear a propósito: son identificadores propios de Meta,
   no datos personales, y hashearlos los vuelve inservibles. */
$user = [];

$emailRaw = strtolower(trim((string) (($d['user_data']['em'] ?? ''))));
if ($emailRaw !== '' && filter_var($emailRaw, FILTER_VALIDATE_EMAIL)) {
    $user['em'] = [hash('sha256', $emailRaw)];
}

$telRaw = preg_replace('/\D/', '', (string) (($d['user_data']['ph'] ?? '')));
if (strlen($telRaw) >= 8) {
    $user['ph'] = [hash('sha256', $telRaw)];
}

/* Estas cuatro son las que más levantan el match y no las manda el JS:
   llegan solas por ser same-origin. */
if (!empty($_COOKIE['_fbp'])) {
    $user['fbp'] = (string) $_COOKIE['_fbp'];
}
if (!empty($_COOKIE['_fbc'])) {
    $user['fbc'] = (string) $_COOKIE['_fbc'];
}
$user['client_ip_address'] = ip_visitante();
$user['client_user_agent'] = substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500);

/* Sin ningún identificador el evento no matchea con nadie y sólo ensucia. */
if ($user['client_ip_address'] === '' && empty($user['fbp']) && empty($user['em'])) {
    done(422, 'Sin datos para matchear');
}

$custom = is_array($d['custom_data'] ?? null) ? $d['custom_data'] : [];

$payload = [
    'data' => [[
        'event_name'       => $evento,
        'event_time'       => time(),
        'event_id'         => $eventId,
        'event_source_url' => substr((string) ($d['event_source_url'] ?? ''), 0, 500),
        'action_source'    => 'website',
        'user_data'        => $user,
        'custom_data'      => $custom,
    ]],
];

$payload['access_token'] = META_CAPI_TOKEN;

/* Sólo en pruebas: hace que los eventos aparezcan en Events Manager →
   Test Events sin contaminar los datos reales de la campaña. */
if (defined('META_TEST_EVENT_CODE') && META_TEST_EVENT_CODE !== '') {
    $payload['test_event_code'] = META_TEST_EVENT_CODE;
}

$url = 'https://graph.facebook.com/' . CAPI_API_VERSION . '/'
     . rawurlencode(META_PIXEL_ID) . '/events';

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
    /* Cortos a propósito: el visitante ya está esperando la respuesta del
       cotizador. Si Meta tarda, preferimos perder el evento antes que
       colgarle la conversión. */
    CURLOPT_CONNECTTIMEOUT => 2,
    CURLOPT_TIMEOUT        => 4,
]);

$resp = curl_exec($ch);
$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

if ($resp === false || $code >= 400) {
    /* El evento se pierde y no hay reintento: con este volumen no justifica
       una cola. Queda en el log para poder detectar si empieza a fallar
       seguido (token vencido es la causa típica). */
    error_log('meta-capi: ' . $evento . ' HTTP ' . $code . ' ' . ($err !== '' ? $err : substr((string) $resp, 0, 300)));
    done(502, 'Meta rechazó el evento');
}

done(200, 'ok');

/**
 * IP real del visitante. Hostinger mete Cloudflare adelante, así que
 * REMOTE_ADDR es el proxy y no sirve para matchear: hay que mirar primero
 * los headers que deja el CDN.
 */
function ip_visitante(): string
{
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $h) {
        $v = $_SERVER[$h] ?? '';
        if (!is_string($v) || $v === '') {
            continue;
        }
        // X-Forwarded-For puede venir como "cliente, proxy1, proxy2".
        $ip = trim(explode(',', $v)[0]);
        if (filter_var($ip, FILTER_VALIDATE_IP)) {
            return $ip;
        }
    }
    return '';
}
