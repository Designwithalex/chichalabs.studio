<?php
declare(strict_types=1);

/**
 * ChichaLabs Studio — Propuesta automática en PDF
 * ------------------------------------------------------------------
 * Template HTML + render a PDF con Dompdf (vendorizado en includes/dompdf).
 *
 * Lo llama api/cotizador-pdf.php, que a su vez lo llama n8n. Este archivo NO
 * calcula precios: recibe el desglose ya resuelto por el workflow (el único
 * que lee las horas desde Notion) y sólo lo maqueta.
 *
 * El diseño sigue el sistema "Dark Premium" (css/tokens.css). Para pasar a
 * una versión clara (mejor para imprimir) alcanza con cambiar el bloque de
 * colores de abajo — la estructura no se toca.
 */

require_once __DIR__ . '/dompdf/autoload.inc.php';

use Dompdf\Dompdf;
use Dompdf\Options;

/** Formatea un número como pesos argentinos: 1170000 → "$ 1.170.000" */
function pdf_ars($n): string
{
    return '$ ' . number_format((float) $n, 0, ',', '.');
}

function pdf_e($s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Horas sin decimales inútiles: 10.0 → "10", 2.5 → "2,5" */
function pdf_horas($h): string
{
    $t = number_format((float) $h, 1, ',', '.');
    return rtrim(rtrim($t, '0'), ',');
}

/** Agrupa los módulos por categoría respetando el orden del sistema. */
function pdf_agrupar(array $modulos): array
{
    $orden  = ['Base', 'Contenido', 'Funcionalidad', 'Diseño', 'Integración', 'Revisión'];
    $grupos = [];

    foreach ($modulos as $m) {
        $grupos[$m['categoria'] ?? 'Otros'][] = $m;
    }

    uksort($grupos, static function ($a, $b) use ($orden) {
        $ia = array_search($a, $orden, true);
        $ib = array_search($b, $orden, true);
        return ($ia === false ? 99 : $ia) <=> ($ib === false ? 99 : $ib);
    });

    return $grupos;
}

/**
 * HTML completo de la propuesta. Se usa para el PDF y para el preview en
 * navegador (tools/preview-propuesta.php).
 */
function propuesta_html(array $d): string
{
    // ── paleta ────────────────────────────────────────────────────
    // Documento claro con "muebles" de marca en oscuro (banda de cabecera,
    // bloque de totales). Es deliberado y no un downgrade del Dark Premium:
    //  · Dompdf pinta el área de @page margin siempre en blanco, así que un
    //    PDF full-dark queda con un marco blanco alrededor. Ver DECISIONES
    //    en README-COTIZADOR.md.
    //  · Una propuesta se imprime, se reenvía y se anota. En claro funciona.
    // El verde de texto se oscurece para que tenga contraste AA sobre blanco;
    // el verde de marca (#2CE58B) se reserva para lo que va sobre oscuro.
    $paper    = '#FFFFFF';
    $ink      = '#0A0A0B';   // títulos
    $body     = '#4A4E55';   // cuerpo
    $muted    = '#8A9099';   // labels y notas
    $line     = '#E4E6E9';
    $surface  = '#F7F8F9';
    $dark     = '#0A0A0B';   // bandas de marca
    $green    = '#0B8049';   // verde legible sobre blanco (5.3:1)
    $greenLit = '#2CE58B';   // verde de marca — sólo sobre oscuro
    $greenBg  = '#EDFBF4';
    $greenLn  = '#B6ECD1';

    $cliente  = $d['cliente'] ?? [];
    $grupos   = pdf_agrupar($d['modulos'] ?? []);
    $calendar = (string) ($d['calendar'] ?? '');
    $fontDir  = str_replace('\\', '/', __DIR__ . '/fonts');

    // ── filas de la tabla de alcance ──────────────────────────────
    $filas = '';
    foreach ($grupos as $cat => $items) {
        $filas .= '<tr><td class="cat" colspan="3">' . pdf_e($cat) . '</td></tr>';
        foreach ($items as $m) {
            $cant   = (int) ($m['cantidad'] ?? 1);
            $mult   = $cant > 1 ? ' <span class="mult">&times;' . $cant . '</span>' : '';
            $desc   = !empty($m['descripcion'])
                ? '<div class="mod__desc">' . pdf_e($m['descripcion']) . '</div>'
                : '';

            $filas .= '<tr>'
                . '<td class="mod"><div class="mod__name">' . pdf_e($m['modulo'] ?? '') . $mult . '</div>' . $desc . '</td>'
                . '<td class="num">' . pdf_horas($m['horas'] ?? 0) . ' h</td>'
                . '<td class="num strong">' . pdf_ars($m['subtotal'] ?? 0) . '</td>'
                . '</tr>';
        }
    }

    // ── ficha del cliente ─────────────────────────────────────────
    $metaHtml = '';
    foreach ([['Empresa', 'empresa'], ['Email', 'email'], ['Teléfono', 'telefono']] as [$label, $key]) {
        if (!empty($cliente[$key])) {
            $metaHtml .= '<tr><td class="k">' . pdf_e($label) . '</td>'
                       . '<td class="v">' . pdf_e($cliente[$key]) . '</td></tr>';
        }
    }

    $mensajeHtml = '';
    if (!empty($d['mensaje'])) {
        $mensajeHtml = '<div class="quote">'
            . '<div class="quote__label">Lo que nos contaste</div>'
            . '<div class="quote__text">' . nl2br(pdf_e($d['mensaje'])) . '</div>'
            . '</div>';
    }

    $ctaHtml = '';
    if ($calendar !== '') {
        $ctaHtml = '<div class="cta">'
            . '<div class="cta__title">¿Lo charlamos?</div>'
            . '<div class="cta__text">Si querés repasar el alcance, sumar o sacar módulos, o resolver dudas antes de arrancar, '
            . 'agendá una reunión de 20 minutos cuando te quede cómodo.</div>'
            . '<div class="cta__link"><a href="' . pdf_e($calendar) . '">Reservar un horario &rarr;</a></div>'
            . '</div>';
    }

    $numero    = pdf_e($d['numero']   ?? '');
    $fecha     = pdf_e($d['fecha']    ?? '');
    $validez   = pdf_e($d['validez']  ?? '15 días');
    $servicio  = pdf_e($d['servicio'] ?? '');
    $nombre    = pdf_e($cliente['nombre'] ?? '');
    $horasTot  = pdf_horas($d['horas'] ?? 0);
    $valorHora = pdf_ars($d['valor_hora'] ?? 0);
    $total     = pdf_ars($d['total'] ?? 0);

    return <<<HTML
<!DOCTYPE html>
<html lang="es-AR">
<head>
<meta charset="UTF-8">
<title>Propuesta {$numero} — ChichaLabs Studio</title>
<style>
  @font-face { font-family:'Inter'; font-weight:400; src:url('{$fontDir}/Inter-Regular.ttf') format('truetype'); }
  @font-face { font-family:'Inter'; font-weight:600; src:url('{$fontDir}/Inter-SemiBold.ttf') format('truetype'); }
  @font-face { font-family:'Inter'; font-weight:700; src:url('{$fontDir}/Inter-Bold.ttf') format('truetype'); }
  @font-face { font-family:'JBMono'; font-weight:500; src:url('{$fontDir}/JetBrainsMono-Medium.ttf') format('truetype'); }

  /* Con @page margin, Dompdf posiciona los position:fixed DENTRO del margen,
     y el área de margen la pinta blanca. Por eso el documento es claro.
     Ojo: si se le pone margin:0 a html o body, Dompdf ignora este @page. */
  @page { margin: 15mm 14mm 16mm 14mm; }

  body {
    background: {$paper};
    color: {$body};
    font-family: 'Inter', sans-serif;
    font-size: 9pt;
    line-height: 1.55;
  }

  .eyebrow {
    font-family:'JBMono', monospace; font-size:6.5pt; font-weight:500;
    letter-spacing:1.4pt; text-transform:uppercase; color:{$muted};
  }

  /* Ningún bloque cerrado se parte al medio entre dos páginas. */
  .head, .card, .quote, .totals, .cta, .sign,
  table.scope tr, .terms li { page-break-inside: avoid; }
  .sec-title { page-break-after: avoid; }

  /* ── Banda de marca ────────────────────────────────── */
  .head { background:{$dark}; border-radius:7pt; padding:11pt 14pt; margin-bottom:20pt; }
  .head table { width:100%; border-collapse:collapse; }
  .head__brand { font-family:'JBMono', monospace; font-weight:500; font-size:10pt;
                 color:#FFFFFF; letter-spacing:0.6pt; }
  .head__brand .studio { color:{$greenLit}; }
  .head__num { font-family:'JBMono', monospace; font-size:7.5pt; color:#8A9099; text-align:right; }

  /* ── Portada ───────────────────────────────────────── */
  .title { font-size:23pt; font-weight:700; color:{$ink}; line-height:1.12; letter-spacing:-0.5pt; margin:0 0 5pt; }
  .subtitle { font-size:10.5pt; color:{$body}; margin:0 0 18pt; }
  .subtitle strong { color:{$green}; font-weight:600; }

  .facts { width:100%; border-collapse:collapse; margin-bottom:16pt; }
  .facts td { vertical-align:top; padding:0; width:33.33%; }
  .facts .lbl { font-family:'JBMono', monospace; font-size:6.5pt; letter-spacing:1.2pt;
                text-transform:uppercase; color:{$muted}; padding-bottom:3pt; }
  .facts .val { font-size:9.5pt; color:{$ink}; font-weight:600; }

  .card { background:{$surface}; border:0.6pt solid {$line}; border-radius:7pt; padding:12pt 14pt; margin-bottom:16pt; }
  .card--client table { width:100%; border-collapse:collapse; }
  .card--client .k { font-family:'JBMono', monospace; font-size:6.5pt; letter-spacing:1.2pt;
                     text-transform:uppercase; color:{$muted}; width:70pt; padding:2.5pt 0; vertical-align:top; }
  .card--client .v { font-size:9pt; color:{$ink}; padding:2.5pt 0; }
  .card--client .who { font-size:12pt; font-weight:600; color:{$ink}; padding-bottom:6pt;
                       border-bottom:0.6pt solid {$line}; margin-bottom:7pt; }

  .quote { border-left:1.5pt solid {$green}; padding:2pt 0 2pt 11pt; margin-bottom:16pt; }
  .quote__label { font-family:'JBMono', monospace; font-size:6.5pt; letter-spacing:1.2pt;
                  text-transform:uppercase; color:{$muted}; margin-bottom:3pt; }
  .quote__text { font-size:9pt; color:{$body}; font-style:italic; }

  /* ── Tabla de alcance ──────────────────────────────── */
  .sec-title { font-size:13pt; font-weight:700; color:{$ink}; margin:0 0 3pt; letter-spacing:-0.2pt; }
  .sec-intro { font-size:8.5pt; color:{$muted}; margin:0 0 10pt; }

  table.scope { width:100%; border-collapse:collapse; }
  table.scope th {
    font-family:'JBMono', monospace; font-size:6.5pt; font-weight:500; letter-spacing:1.2pt;
    text-transform:uppercase; color:{$muted}; text-align:left;
    padding:0 0 6pt; border-bottom:0.8pt solid {$ink};
  }
  table.scope th.num, table.scope td.num { text-align:right; }
  table.scope th.h { width:44pt; }
  table.scope th.s { width:80pt; }

  table.scope td { padding:7pt 0; border-bottom:0.6pt solid {$line}; vertical-align:top; }
  table.scope td.cat {
    font-family:'JBMono', monospace; font-size:6.5pt; letter-spacing:1.2pt; text-transform:uppercase;
    color:{$green}; padding:11pt 0 4pt; border-bottom:none;
  }
  .mod { padding-right:12pt; }
  .mod__name { font-size:9.5pt; font-weight:600; color:{$ink}; }
  .mod__desc { font-size:8pt; color:{$muted}; margin-top:1.5pt; }
  .mult { font-family:'JBMono', monospace; font-size:8pt; color:{$green}; }
  td.num { font-family:'JBMono', monospace; font-size:8.5pt; color:{$muted}; white-space:nowrap; }
  td.num.strong { color:{$ink}; font-size:9pt; }

  /* ── Totales (bloque oscuro de marca) ──────────────── */
  .totals { margin-top:16pt; background:{$dark}; border-radius:7pt; padding:14pt 16pt; }
  .totals table { width:100%; border-collapse:collapse; }
  .totals .lbl { font-size:9pt; color:#A1A1AA; padding:2.5pt 0; }
  .totals .val { font-size:9pt; color:#F5F6F7; text-align:right; font-family:'JBMono', monospace; padding:2.5pt 0; }
  .totals .grand-l { font-size:12pt; font-weight:700; color:#FFFFFF; padding-top:10pt;
                     border-top:0.6pt solid #2A2D32; }
  .totals .grand-v { font-size:19pt; font-weight:700; color:{$greenLit}; text-align:right;
                     font-family:'Inter', sans-serif; padding-top:10pt; border-top:0.6pt solid #2A2D32;
                     letter-spacing:-0.4pt; }
  .totals .foot { font-size:7.5pt; color:#8A9099; padding-top:7pt; }

  /* ── CTA + condiciones ─────────────────────────────── */
  .cta { margin-top:16pt; background:{$greenBg}; border:0.6pt solid {$greenLn}; border-radius:7pt; padding:13pt 15pt; }
  .cta__title { font-size:11pt; font-weight:700; color:{$ink}; margin-bottom:3pt; }
  .cta__text { font-size:8.5pt; color:{$body}; margin-bottom:7pt; }
  .cta__link a { font-size:9pt; font-weight:600; color:{$green}; text-decoration:none; }

  .terms { margin-top:16pt; }
  .terms ul { margin:6pt 0 0; padding-left:11pt; }
  .terms li { font-size:8pt; color:{$muted}; margin-bottom:3.5pt; }

  .sign { margin-top:18pt; padding-top:10pt; border-top:0.6pt solid {$line}; font-size:8pt; color:{$muted}; }
  .sign strong { color:{$ink}; }

  /* Pie fijo, en todas las páginas (queda dentro del margen de @page) */
  .foot-fixed {
    position: fixed; bottom: 0; left: 0; right: 0; width:100%;
    border-collapse:collapse;
    font-family:'JBMono', monospace; font-size:6.5pt; letter-spacing:0.8pt; color:{$muted};
  }
  .foot-fixed td { width:50%; border-top:0.6pt solid {$line}; padding-top:4pt; }
  .foot-fixed .r { text-align:right; }
</style>
</head>
<body>

  <table class="foot-fixed">
    <tr>
      <td>CHICHALABS STUDIO — Buenos Aires, Argentina</td>
      <td class="r">{$numero} · chichalabs.studio</td>
    </tr>
  </table>

  <!-- Banda de marca -->
  <div class="head">
    <table>
      <tr>
        <td class="head__brand">[ CHICHALABS ] <span class="studio">STUDIO</span></td>
        <td class="head__num">{$numero}</td>
      </tr>
    </table>
  </div>

  <!-- Portada -->
  <div class="eyebrow">Propuesta de trabajo</div>
  <h1 class="title">{$servicio}</h1>
  <p class="subtitle">Presupuesto estimado a partir de los módulos que elegiste en el cotizador de <strong>chichalabs.studio</strong>.</p>

  <table class="facts">
    <tr>
      <td><div class="lbl">Fecha</div><div class="val">{$fecha}</div></td>
      <td><div class="lbl">Validez</div><div class="val">{$validez}</div></td>
      <td><div class="lbl">Propuesta</div><div class="val">{$numero}</div></td>
    </tr>
  </table>

  <div class="card card--client">
    <div class="who">{$nombre}</div>
    <table>{$metaHtml}</table>
  </div>

  {$mensajeHtml}

  <!-- Alcance -->
  <h2 class="sec-title">Qué incluye</h2>
  <p class="sec-intro">Cada módulo es una parte concreta del trabajo, con las horas de desarrollo que requiere.</p>

  <table class="scope">
    <thead>
      <tr>
        <th>Módulo</th>
        <th class="num h">Horas</th>
        <th class="num s">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      {$filas}
    </tbody>
  </table>

  <!-- Totales -->
  <div class="totals">
    <table>
      <tr>
        <td class="lbl">Horas de trabajo estimadas</td>
        <td class="val">{$horasTot} h</td>
      </tr>
      <tr>
        <td class="lbl">Valor de la hora</td>
        <td class="val">{$valorHora}</td>
      </tr>
      <tr>
        <td class="grand-l">Total del proyecto</td>
        <td class="grand-v">{$total}</td>
      </tr>
      <tr>
        <td class="foot" colspan="2">Precio en pesos argentinos. No incluye IVA ni costos de terceros (hosting, dominios, licencias, APIs).</td>
      </tr>
    </table>
  </div>

  {$ctaHtml}

  <!-- Condiciones -->
  <div class="terms">
    <h2 class="sec-title">Condiciones</h2>
    <ul>
      <li>Esta propuesta es una estimación automática según los módulos elegidos. El alcance final se confirma en una reunión antes de arrancar.</li>
      <li>Presupuesto válido por {$validez} desde la fecha de emisión.</li>
      <li>Forma de pago: 50% para iniciar y 50% contra entrega, salvo que acordemos otra cosa.</li>
      <li>Los plazos se definen al cerrar el alcance y dependen de la disponibilidad de contenidos y accesos de tu lado.</li>
      <li>No incluye costos de terceros (hosting, dominios, licencias de software, APIs pagas) ni IVA.</li>
      <li>El código y los entregables quedan a tu nombre una vez saldado el proyecto.</li>
    </ul>
  </div>

  <div class="sign">
    <strong>ChichaLabs Studio</strong> — Estrategia, diseño, desarrollo, automatización e IA aplicada.<br>
    notificaciones@chichalabs.studio · chichalabs.studio
  </div>

</body>
</html>
HTML;
}

/**
 * Renderiza la propuesta y devuelve el PDF como string binario.
 */
function propuesta_pdf(array $d): string
{
    $options = new Options();
    $options->set('isRemoteEnabled', false);   // el template no trae recursos externos
    $options->set('isHtml5ParserEnabled', true);
    $options->set('defaultFont', 'Inter');
    $options->set('chroot', dirname(__DIR__));
    // El cache de fuentes va a un dir temporal: en hosting compartido no
    // podemos asumir que includes/dompdf sea escribible.
    $options->set('fontCache', sys_get_temp_dir());

    $dompdf = new Dompdf($options);
    $dompdf->loadHtml(propuesta_html($d), 'UTF-8');
    $dompdf->setPaper('A4', 'portrait');
    $dompdf->render();

    return (string) $dompdf->output();
}
