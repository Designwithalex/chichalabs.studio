<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth-portal.php';
require_once __DIR__ . '/../includes/csrf.php';

portal_session_start();
$clientId = portal_require_auth();

function reject_proposal(int $proposalId): void
{
    header('Location: /portal/propuesta.php?id=' . $proposalId . '&error=1');
    exit;
}

function notify_n8n_proposal_accepted(int $proposalId, float $totalOnce, float $totalMonthly): void
{
    if (!defined('N8N_PROPOSAL_ACCEPTED_WEBHOOK') || N8N_PROPOSAL_ACCEPTED_WEBHOOK === '') {
        return;
    }

    $payload = json_encode([
        'proposal_id'   => $proposalId,
        'total_once'    => $totalOnce,
        'total_monthly' => $totalMonthly,
        'accepted_at'   => date('c'),
    ]);

    $ch = curl_init(N8N_PROPOSAL_ACCEPTED_WEBHOOK);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT        => 5,
        CURLOPT_RETURNTRANSFER => true,
    ]);
    curl_exec($ch);
    curl_close($ch);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /portal/dashboard.php');
    exit;
}

csrf_require();

$pdo        = db();
$proposalId = (int) ($_POST['proposal_id'] ?? 0);

/* Ownership: la propuesta tiene que pertenecer a un proyecto de ESTE cliente. */
$stmt = $pdo->prepare(
    'SELECT p.*
     FROM proposals p
     JOIN projects pr ON pr.id = p.project_id
     WHERE p.id = ? AND pr.client_id = ?'
);
$stmt->execute([$proposalId, $clientId]);
$proposal = $stmt->fetch();

if (!$proposal || $proposal['status'] !== 'enviada') {
    reject_proposal($proposalId);
}

/* No se acepta una propuesta vencida — el cliente tiene que pedir que se la renueven. */
if ($proposal['sent_at'] !== null) {
    $expiresAt = (new DateTimeImmutable($proposal['sent_at']))
        ->modify('+' . (int) $proposal['validity_days'] . ' days');
    if ($expiresAt < new DateTimeImmutable()) {
        reject_proposal($proposalId);
    }
}

$stmt = $pdo->prepare('SELECT * FROM proposal_modules WHERE proposal_id = ?');
$stmt->execute([$proposalId]);
$allModules = $stmt->fetchAll();

$submittedIds = array_map('intval', (array) ($_POST['module_ids'] ?? []));

$selected = [];
foreach ($allModules as $m) {
    /* Los módulos obligatorios siempre entran — nunca confiamos en el POST para esto,
       podría haber sido manipulado en el cliente. */
    if ($m['is_locked'] || in_array((int) $m['id'], $submittedIds, true)) {
        $selected[] = $m;
    }
}

if (!$selected) {
    reject_proposal($proposalId);
}

/* El precio final se recalcula acá, contra la base — nunca se confía en un número
   que venga del navegador. Mientras algún módulo seleccionado tenga rango abierto,
   no se puede aceptar (el frontend ya lo impide, esto es la validación real). */
foreach ($selected as $m) {
    if ((float) $m['price_min'] !== (float) $m['price_max']) {
        reject_proposal($proposalId);
    }
}

$totalOnce    = 0.0;
$totalMonthly = 0.0;
$snapshot     = [];

foreach ($selected as $m) {
    $price = (float) $m['price_min'];
    if ($m['billing_type'] === 'monthly') {
        $totalMonthly += $price;
    } else {
        $totalOnce += $price;
    }
    $snapshot[] = [
        'id'            => (int) $m['id'],
        'module_number' => (int) $m['module_number'],
        'name'          => $m['name'],
        'category'      => $m['category'],
        'price_min'     => $price,
        'billing_type'  => $m['billing_type'],
    ];
}

$stmt = $pdo->prepare(
    "UPDATE proposals
     SET status = 'aceptada', accepted_at = NOW(), accepted_total_once = ?, accepted_total_monthly = ?, accepted_selection = ?
     WHERE id = ? AND status = 'enviada'"
);
$stmt->execute([
    $totalOnce,
    $totalMonthly,
    json_encode($snapshot, JSON_UNESCAPED_UNICODE),
    $proposalId,
]);

/* rowCount() === 0 significa que otro request ya la aceptó en simultáneo (carrera) —
   no es un error, simplemente no volvemos a notificar. */
if ($stmt->rowCount() === 1) {
    notify_n8n_proposal_accepted($proposalId, $totalOnce, $totalMonthly);
}

header('Location: /portal/propuesta.php?id=' . $proposalId);
exit;
