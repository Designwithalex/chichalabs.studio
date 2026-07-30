<?php
/**
 * Preview del PDF de propuesta — SÓLO PARA DESARROLLO.
 * No se sube al servidor (ver exclude en .github/workflows/deploy.yml).
 *
 *   php tools/preview-propuesta.php          → escribe preview.html + preview.pdf
 *   php tools/preview-propuesta.php --html   → sólo el HTML (rápido, para iterar)
 *
 * Sirve para tocar el diseño de includes/propuesta-pdf.php y ver el resultado
 * sin tener que pasar por n8n ni por el formulario.
 */
declare(strict_types=1);
error_reporting(E_ALL & ~E_DEPRECATED);
require __DIR__ . '/../includes/propuesta-pdf.php';

$demo = [
    'numero'   => 'CL-0726-0001',
    'fecha'    => '28 de julio de 2026',
    'validez'  => '15 días',
    'servicio' => 'Automatizaciones',
    'cliente'  => [
        'nombre'   => 'Martina Álvarez',
        'empresa'  => 'Distribuidora Pampa S.R.L.',
        'email'    => 'martina@pampa.com.ar',
        'telefono' => '+54 9 11 5555-1234',
    ],
    'mensaje' => "Nos entran consultas por WhatsApp, Instagram y el formulario de la web.\nHoy las cargamos a mano en una planilla y se nos escapan.",
    'modulos' => [
        ['modulo' => 'Automatización base (1 flujo simple)', 'categoria' => 'Base',          'descripcion' => 'Conecta 2 herramientas, 1 disparador, sin lógica condicional. Incluye pruebas básicas.', 'cantidad' => 1, 'horas' => 10, 'subtotal' => 450000],
        ['modulo' => 'Dashboard de monitoreo del flujo',     'categoria' => 'Funcionalidad', 'descripcion' => 'Panel simple para ver ejecuciones, éxitos y errores sin entrar a n8n.',                      'cantidad' => 1, 'horas' => 6,  'subtotal' => 270000],
        ['modulo' => 'Disparador adicional',                 'categoria' => 'Funcionalidad', 'descripcion' => 'Más de 1 forma de arrancar el mismo flujo.',                                                    'cantidad' => 2, 'horas' => 10, 'subtotal' => 450000],
    ],
    'horas'      => 26,
    'valor_hora' => 45000,
    'total'      => 1170000,
    'calendar'   => 'https://calendar.app.google/YrXbTqH8iREgLShf6',
];

$dir = __DIR__;
file_put_contents($dir . '/preview.html', propuesta_html($demo));
echo "→ tools/preview.html\n";

if (!in_array('--html', $argv, true)) {
    file_put_contents($dir . '/preview.pdf', propuesta_pdf($demo));
    echo "→ tools/preview.pdf\n";
}
