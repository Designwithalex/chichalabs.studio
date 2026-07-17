<?php
declare(strict_types=1);

/** Labels compartidos entre /admin y /portal para no divergir. */

const PROJECT_STATUS_LABELS = [
    'diagnostico'        => 'Diagnóstico',
    'propuesta_enviada'  => 'Propuesta enviada',
    'propuesta_aceptada' => 'Propuesta aceptada',
    'en_diseno'          => 'En diseño',
    'en_desarrollo'      => 'En desarrollo',
    'implementacion'     => 'Implementación',
    'finalizado'         => 'Finalizado',
];

const PROPOSAL_STATUS_LABELS = [
    'borrador' => 'Borrador',
    'enviada'  => 'Enviada',
    'aceptada' => 'Aceptada',
    'vencida'  => 'Vencida',
];

/** Los 5 pasos del método, para el portal de clientes. */
const METHOD_STEPS = ['Diagnóstico', 'Estrategia', 'Diseño', 'Desarrollo', 'Implementación'];

const PROJECT_STATUS_STEP = [
    'diagnostico'         => 1,
    'propuesta_enviada'   => 2,
    'propuesta_aceptada'  => 2,
    'en_diseno'           => 3,
    'en_desarrollo'       => 4,
    'implementacion'      => 5,
    'finalizado'          => 5,
];
