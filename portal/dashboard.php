<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth-portal.php';
require_once __DIR__ . '/../includes/statuses.php';

portal_session_start();
$clientId = portal_require_auth();

$pdo = db();

$stmt = $pdo->prepare('SELECT * FROM clients WHERE id = ?');
$stmt->execute([$clientId]);
$client = $stmt->fetch();

$stmt = $pdo->prepare('SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC');
$stmt->execute([$clientId]);
$projects = $stmt->fetchAll();

foreach ($projects as &$project) {
    $stmt = $pdo->prepare(
        "SELECT * FROM proposals WHERE project_id = ? AND status IN ('enviada', 'aceptada') ORDER BY created_at DESC"
    );
    $stmt->execute([$project['id']]);
    $project['proposals'] = $stmt->fetchAll();
}
unset($project);

$pageTitle = 'Mis proyectos';
require __DIR__ . '/inc/header.php';
?>
<main class="container portal-dashboard">
  <h1>Hola, <?= htmlspecialchars($client['name'], ENT_QUOTES, 'UTF-8') ?></h1>

  <?php if (!$projects): ?>
    <p class="portal-empty">Todavía no tenés proyectos activos. Si acabás de pedir un diagnóstico, en breve vas a ver novedades acá.</p>
  <?php endif; ?>

  <?php foreach ($projects as $project): ?>
    <?php $step = PROJECT_STATUS_STEP[$project['status']] ?? 1; ?>
    <section class="portal-project">
      <h2><?= htmlspecialchars($project['name'], ENT_QUOTES, 'UTF-8') ?></h2>
      <p class="portal-project__status"><?= htmlspecialchars(PROJECT_STATUS_LABELS[$project['status']] ?? $project['status'], ENT_QUOTES, 'UTF-8') ?></p>

      <ol class="portal-steps">
        <?php foreach (METHOD_STEPS as $i => $label): $n = $i + 1; ?>
          <li class="portal-steps__item <?= $n < $step ? 'is-done' : ($n === $step ? 'is-current' : '') ?>">
            <span class="portal-steps__num"><?= $n ?></span>
            <span class="portal-steps__label"><?= htmlspecialchars($label, ENT_QUOTES, 'UTF-8') ?></span>
          </li>
        <?php endforeach; ?>
      </ol>

      <?php if ($project['proposals']): ?>
        <div class="portal-project__proposals">
          <?php foreach ($project['proposals'] as $proposal): ?>
            <a href="/portal/propuesta.php?id=<?= (int) $proposal['id'] ?>" class="btn btn--ghost">
              Ver propuesta: <?= htmlspecialchars($proposal['title'], ENT_QUOTES, 'UTF-8') ?>
            </a>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </section>
  <?php endforeach; ?>
</main>
<?php require __DIR__ . '/inc/footer.php'; ?>
