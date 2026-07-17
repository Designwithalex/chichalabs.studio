<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth-portal.php';
require_once __DIR__ . '/../includes/csrf.php';

portal_session_start();
$clientId = portal_require_auth();

$pdo = db();
$proposalId = (int) ($_GET['id'] ?? 0);

/* Ownership: la propuesta tiene que pertenecer a un proyecto de ESTE cliente.
   Nunca confiar en el ?id= sin este join. */
$stmt = $pdo->prepare(
    'SELECT p.*, pr.name AS project_name
     FROM proposals p
     JOIN projects pr ON pr.id = p.project_id
     WHERE p.id = ? AND pr.client_id = ?'
);
$stmt->execute([$proposalId, $clientId]);
$proposal = $stmt->fetch();

/* Un borrador todavía no se comparte con el cliente — mismo trato que "no existe". */
if (!$proposal || $proposal['status'] === 'borrador') {
    http_response_code(404);
    $pageTitle = 'No encontrada';
    require __DIR__ . '/inc/header.php';
    echo '<main class="container"><p>No encontramos esa propuesta.</p></main>';
    require __DIR__ . '/inc/footer.php';
    exit;
}

$isAccepted = $proposal['status'] === 'aceptada';
$isExpired  = false;

if (!$isAccepted && $proposal['sent_at'] !== null) {
    $expiresAt = (new DateTimeImmutable($proposal['sent_at']))
        ->modify('+' . (int) $proposal['validity_days'] . ' days');
    $isExpired = $expiresAt < new DateTimeImmutable();
}

$pageTitle = $proposal['title'];
require __DIR__ . '/inc/header.php';
?>
<main class="container portal-proposal">
  <p class="portal-breadcrumb">
    <a href="/portal/dashboard.php">← Mis proyectos</a> · <?= htmlspecialchars($proposal['project_name'], ENT_QUOTES, 'UTF-8') ?>
  </p>
  <h1><?= htmlspecialchars($proposal['title'], ENT_QUOTES, 'UTF-8') ?></h1>

  <?php if (isset($_GET['error'])): ?>
    <p class="portal-alert">No pudimos procesar la aceptación (la propuesta pudo haber cambiado o vencido). Volvé a revisar la selección o escribinos si el problema sigue.</p>
  <?php endif; ?>

  <?php if ($isAccepted): ?>
    <?php
    $selection = json_decode((string) $proposal['accepted_selection'], true) ?: [];
    $acceptedAt = $proposal['accepted_at'] ? (new DateTimeImmutable($proposal['accepted_at']))->format('d/m/Y') : '';
    ?>
    <p class="portal-alert portal-alert--ok">Propuesta aceptada<?= $acceptedAt ? ' el ' . htmlspecialchars($acceptedAt, ENT_QUOTES, 'UTF-8') : '' ?>. Esta es la selección final, ya no se puede modificar.</p>

    <div class="pc-categories">
      <?php foreach ($selection as $m): ?>
        <div class="pc-module pc-module--locked">
          <span class="pc-module__body">
            <span class="pc-module__head">
              <span class="pc-module__num">Módulo <?= str_pad((string) ($m['module_number'] ?? ''), 2, '0', STR_PAD_LEFT) ?></span>
              <span class="pc-module__name"><?= htmlspecialchars((string) ($m['name'] ?? ''), ENT_QUOTES, 'UTF-8') ?></span>
              <span class="pc-module__price">
                <?= htmlspecialchars($proposal['currency'] . ' ' . number_format((float) ($m['price_min'] ?? 0), 0, ',', '.'), ENT_QUOTES, 'UTF-8') ?><?= (($m['billing_type'] ?? '') === 'monthly') ? ' / mes' : '' ?>
              </span>
            </span>
          </span>
        </div>
      <?php endforeach; ?>
    </div>

    <div class="pc-totals">
      <?php if ($proposal['accepted_total_once'] !== null && (float) $proposal['accepted_total_once'] > 0): ?>
        <div class="pc-totals__row">
          <span class="pc-totals__label">Costo único</span>
          <span class="pc-totals__value"><?= htmlspecialchars($proposal['currency'] . ' ' . number_format((float) $proposal['accepted_total_once'], 0, ',', '.'), ENT_QUOTES, 'UTF-8') ?></span>
        </div>
      <?php endif; ?>
      <?php if ($proposal['accepted_total_monthly'] !== null && (float) $proposal['accepted_total_monthly'] > 0): ?>
        <div class="pc-totals__row">
          <span class="pc-totals__label">Costo mensual</span>
          <span class="pc-totals__value"><?= htmlspecialchars($proposal['currency'] . ' ' . number_format((float) $proposal['accepted_total_monthly'], 0, ',', '.'), ENT_QUOTES, 'UTF-8') ?></span>
        </div>
      <?php endif; ?>
    </div>

  <?php else: ?>
    <?php
    $stmt = $pdo->prepare('SELECT * FROM proposal_modules WHERE proposal_id = ? ORDER BY sort_order ASC, module_number ASC');
    $stmt->execute([$proposalId]);
    $modules = $stmt->fetchAll();

    $jsModules = array_map(static function (array $m): array {
        return [
            'id'                 => (int) $m['id'],
            'module_number'      => (int) $m['module_number'],
            'name'               => $m['name'],
            'category'           => $m['category'],
            'description'        => $m['description'],
            'price_min'          => (float) $m['price_min'],
            'price_max'          => (float) $m['price_max'],
            'billing_type'       => $m['billing_type'],
            'delivery_estimate'  => $m['delivery_estimate'],
            'notes'              => $m['notes'],
            'external_cost_note' => $m['external_cost_note'],
            'is_locked'          => (bool) $m['is_locked'],
            'default_checked'    => (bool) $m['default_checked'],
        ];
    }, $modules);

    $jsMeta = [
        'mode'          => 'portal',
        'status'        => $proposal['status'],
        'currency'      => $proposal['currency'],
        'payment_terms' => $proposal['payment_terms'],
        'validity_days' => (int) $proposal['validity_days'],
        'sent_at'       => $proposal['sent_at'],
        'general_notes' => $proposal['general_notes'],
        'expired'       => $isExpired,
    ];
    ?>

    <?php if ($isExpired): ?>
      <div id="proposal-app"></div>
    <?php else: ?>
      <form id="proposal-form" method="POST" action="/portal/aceptar.php">
        <?= csrf_field() ?>
        <input type="hidden" name="proposal_id" value="<?= $proposalId ?>">
        <div id="proposal-app"></div>
      </form>
    <?php endif; ?>

    <script>
      window.MODULES = <?= json_encode($jsModules, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) ?>;
      window.PROPOSAL_META = <?= json_encode($jsMeta, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) ?>;
    </script>
    <script src="/portal/js/proposal-calculator.js"></script>
  <?php endif; ?>
</main>
<?php require __DIR__ . '/inc/footer.php'; ?>
