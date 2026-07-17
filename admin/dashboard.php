<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth-admin.php';
require_once __DIR__ . '/../includes/csrf.php';
require_once __DIR__ . '/../includes/statuses.php';

admin_session_start();
admin_require_auth();

$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_require();
    $action = (string) ($_POST['action'] ?? '');

    if ($action === 'create_client') {
        $name = trim((string) ($_POST['name'] ?? ''));
        $email = trim((string) ($_POST['email'] ?? ''));
        if ($name !== '' && $email !== '') {
            $stmt = $pdo->prepare('INSERT INTO clients (name, company, email, whatsapp) VALUES (?, ?, ?, ?)');
            $stmt->execute([
                $name,
                trim((string) ($_POST['company'] ?? '')) ?: null,
                $email,
                trim((string) ($_POST['whatsapp'] ?? '')) ?: null,
            ]);
        }
    } elseif ($action === 'create_project') {
        $name = trim((string) ($_POST['name'] ?? ''));
        if ($name !== '') {
            $stmt = $pdo->prepare('INSERT INTO projects (client_id, name, status) VALUES (?, ?, ?)');
            $stmt->execute([
                (int) ($_POST['client_id'] ?? 0),
                $name,
                'diagnostico',
            ]);
        }
    } elseif ($action === 'create_proposal') {
        $title = trim((string) ($_POST['title'] ?? ''));
        if ($title !== '') {
            $stmt = $pdo->prepare('INSERT INTO proposals (project_id, title, status) VALUES (?, ?, ?)');
            $stmt->execute([
                (int) ($_POST['project_id'] ?? 0),
                $title,
                'borrador',
            ]);
            $newId = (int) $pdo->lastInsertId();
            header('Location: /admin/propuesta-editor.php?id=' . $newId);
            exit;
        }
    } elseif ($action === 'update_project_status') {
        $status = (string) ($_POST['status'] ?? '');
        if (array_key_exists($status, PROJECT_STATUS_LABELS)) {
            $stmt = $pdo->prepare('UPDATE projects SET status = ? WHERE id = ?');
            $stmt->execute([$status, (int) ($_POST['project_id'] ?? 0)]);
        }
    } elseif ($action === 'update_client') {
        $id    = (int) ($_POST['client_id'] ?? 0);
        $name  = trim((string) ($_POST['name'] ?? ''));
        $email = trim((string) ($_POST['email'] ?? ''));
        if ($id > 0 && $name !== '' && $email !== '') {
            $stmt = $pdo->prepare('UPDATE clients SET name = ?, company = ?, email = ?, whatsapp = ? WHERE id = ?');
            $stmt->execute([
                $name,
                trim((string) ($_POST['company'] ?? '')) ?: null,
                $email,
                trim((string) ($_POST['whatsapp'] ?? '')) ?: null,
                $id,
            ]);
        }
    } elseif ($action === 'delete_client') {
        $id = (int) ($_POST['client_id'] ?? 0);
        if ($id > 0) {
            /* Cascada manual en transacción: las FK son RESTRICT, así que hay que
               borrar los hijos antes que el cliente. Si algo falla, rollback total. */
            try {
                $pdo->beginTransaction();
                $pdo->prepare('DELETE pm FROM proposal_modules pm JOIN proposals p ON p.id = pm.proposal_id JOIN projects pr ON pr.id = p.project_id WHERE pr.client_id = ?')->execute([$id]);
                $pdo->prepare('DELETE pin FROM proposal_internal_notes pin JOIN proposals p ON p.id = pin.proposal_id JOIN projects pr ON pr.id = p.project_id WHERE pr.client_id = ?')->execute([$id]);
                $pdo->prepare('DELETE p FROM proposals p JOIN projects pr ON pr.id = p.project_id WHERE pr.client_id = ?')->execute([$id]);
                $pdo->prepare('DELETE FROM projects WHERE client_id = ?')->execute([$id]);
                $pdo->prepare('DELETE FROM magic_link_tokens WHERE client_id = ?')->execute([$id]);
                $pdo->prepare('DELETE FROM clients WHERE id = ?')->execute([$id]);
                $pdo->commit();
            } catch (Throwable $e) {
                $pdo->rollBack();
            }
        }
    } elseif ($action === 'delete_proposal') {
        $id = (int) ($_POST['proposal_id'] ?? 0);
        if ($id > 0) {
            /* Misma cascada manual que el cliente, pero acotada a una propuesta:
               borrar notas y módulos antes que la propuesta (FK RESTRICT). */
            try {
                $pdo->beginTransaction();
                $pdo->prepare('DELETE FROM proposal_internal_notes WHERE proposal_id = ?')->execute([$id]);
                $pdo->prepare('DELETE FROM proposal_modules WHERE proposal_id = ?')->execute([$id]);
                $pdo->prepare('DELETE FROM proposals WHERE id = ?')->execute([$id]);
                $pdo->commit();
            } catch (Throwable $e) {
                $pdo->rollBack();
            }
        }
    }

    header('Location: /admin/dashboard.php');
    exit;
}

$clients = $pdo->query('SELECT * FROM clients ORDER BY name')->fetchAll();

foreach ($clients as &$client) {
    $stmt = $pdo->prepare('SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC');
    $stmt->execute([$client['id']]);
    $client['projects'] = $stmt->fetchAll();

    foreach ($client['projects'] as &$project) {
        $stmt = $pdo->prepare('SELECT * FROM proposals WHERE project_id = ? ORDER BY created_at DESC');
        $stmt->execute([$project['id']]);
        $project['proposals'] = $stmt->fetchAll();
    }
    unset($project);
}
unset($client);

$pageTitle = 'Dashboard';
require __DIR__ . '/inc/header.php';
?>
<main class="container admin-dashboard">
  <div class="admin-page-head">
    <div>
      <h1>Clientes</h1>
      <p class="admin-muted"><?= count($clients) ?> <?= count($clients) === 1 ? 'cliente cargado' : 'clientes cargados' ?></p>
    </div>
  </div>

  <details class="admin-form-wrap">
    <summary>+ Nuevo cliente</summary>
    <form method="POST" class="admin-form">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="create_client">
      <div class="admin-cols">
        <label>Nombre <input type="text" name="name" required></label>
        <label>Empresa <input type="text" name="company"></label>
        <label>Email <input type="email" name="email" required></label>
        <label>WhatsApp <input type="text" name="whatsapp" placeholder="5491178221468"></label>
      </div>
      <button type="submit" class="btn btn--ghost">Crear cliente</button>
    </form>
  </details>

  <?php if (!$clients): ?>
    <p class="admin-empty">Todavía no hay clientes cargados.</p>
  <?php endif; ?>

  <?php foreach ($clients as $client): ?>
    <section class="admin-client">
      <div class="admin-client__head">
        <h2><?= htmlspecialchars($client['name'], ENT_QUOTES, 'UTF-8') ?>
          <?php if ($client['company']): ?><span class="admin-muted">— <?= htmlspecialchars($client['company'], ENT_QUOTES, 'UTF-8') ?></span><?php endif; ?>
        </h2>
        <p class="admin-muted admin-client__meta"><?= htmlspecialchars($client['email'], ENT_QUOTES, 'UTF-8') ?><?= $client['whatsapp'] ? ' · ' . htmlspecialchars($client['whatsapp'], ENT_QUOTES, 'UTF-8') : '' ?></p>
      </div>

      <details class="admin-form-wrap admin-form-wrap--tight admin-form-wrap--sub">
        <summary>Editar / eliminar cliente</summary>
        <form method="POST" class="admin-form">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="update_client">
          <input type="hidden" name="client_id" value="<?= (int) $client['id'] ?>">
          <div class="admin-cols">
            <label>Nombre <input type="text" name="name" value="<?= htmlspecialchars($client['name'], ENT_QUOTES, 'UTF-8') ?>" required></label>
            <label>Empresa <input type="text" name="company" value="<?= htmlspecialchars((string) ($client['company'] ?? ''), ENT_QUOTES, 'UTF-8') ?>"></label>
            <label>Email <input type="email" name="email" value="<?= htmlspecialchars($client['email'], ENT_QUOTES, 'UTF-8') ?>" required></label>
            <label>WhatsApp <input type="text" name="whatsapp" value="<?= htmlspecialchars((string) ($client['whatsapp'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" placeholder="5491178221468"></label>
          </div>
          <button type="submit" class="btn btn--ghost">Guardar cambios</button>
        </form>
        <form method="POST" class="admin-client__delete" onsubmit="return confirm('¿Eliminar este cliente y TODOS sus proyectos, propuestas y accesos? Esta acción no se puede deshacer.');">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="delete_client">
          <input type="hidden" name="client_id" value="<?= (int) $client['id'] ?>">
          <button type="submit" class="admin-btn-danger">Eliminar cliente</button>
        </form>
      </details>

      <details class="admin-form-wrap">
        <summary>+ Nuevo proyecto para <?= htmlspecialchars($client['name'], ENT_QUOTES, 'UTF-8') ?></summary>
        <form method="POST" class="admin-form admin-form--inline">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="create_project">
          <input type="hidden" name="client_id" value="<?= (int) $client['id'] ?>">
          <label>Nombre del proyecto <input type="text" name="name" required></label>
          <button type="submit" class="btn btn--ghost">Crear proyecto</button>
        </form>
      </details>

      <?php foreach ($client['projects'] as $project): ?>
        <div class="admin-project">
          <div class="admin-project__head">
            <h3><?= htmlspecialchars($project['name'], ENT_QUOTES, 'UTF-8') ?></h3>
            <form method="POST" class="admin-status-form">
              <?= csrf_field() ?>
              <input type="hidden" name="action" value="update_project_status">
              <input type="hidden" name="project_id" value="<?= (int) $project['id'] ?>">
              <select name="status" onchange="this.form.requestSubmit()">
                <?php foreach (PROJECT_STATUS_LABELS as $value => $label): ?>
                  <option value="<?= htmlspecialchars($value, ENT_QUOTES, 'UTF-8') ?>" <?= $project['status'] === $value ? 'selected' : '' ?>>
                    <?= htmlspecialchars($label, ENT_QUOTES, 'UTF-8') ?>
                  </option>
                <?php endforeach; ?>
              </select>
            </form>
          </div>

          <ul class="admin-proposal-list">
            <?php foreach ($project['proposals'] as $proposal): ?>
              <li>
                <a href="/admin/propuesta-editor.php?id=<?= (int) $proposal['id'] ?>">
                  <?= htmlspecialchars($proposal['title'], ENT_QUOTES, 'UTF-8') ?>
                </a>
                <span class="admin-badge admin-badge--<?= htmlspecialchars($proposal['status'], ENT_QUOTES, 'UTF-8') ?>">
                  <?= htmlspecialchars(PROPOSAL_STATUS_LABELS[$proposal['status']] ?? $proposal['status'], ENT_QUOTES, 'UTF-8') ?>
                </span>
                <form method="POST" class="admin-proposal-list__delete" onsubmit="return confirm('¿Eliminar la propuesta «<?= htmlspecialchars(addslashes($proposal['title']), ENT_QUOTES, 'UTF-8') ?>» y todos sus módulos y notas? Esta acción no se puede deshacer.');">
                  <?= csrf_field() ?>
                  <input type="hidden" name="action" value="delete_proposal">
                  <input type="hidden" name="proposal_id" value="<?= (int) $proposal['id'] ?>">
                  <button type="submit" class="admin-link-btn admin-link-btn--danger">Eliminar</button>
                </form>
              </li>
            <?php endforeach; ?>
            <?php if (!$project['proposals']): ?><li class="admin-empty">Sin propuestas todavía. Creá la primera abajo.</li><?php endif; ?>
          </ul>

          <details class="admin-form-wrap admin-form-wrap--tight">
            <summary>+ Nueva propuesta</summary>
            <form method="POST" class="admin-form admin-form--inline">
              <?= csrf_field() ?>
              <input type="hidden" name="action" value="create_proposal">
              <input type="hidden" name="project_id" value="<?= (int) $project['id'] ?>">
              <label>Título <input type="text" name="title" required placeholder="Ej: Propuesta inicial"></label>
              <button type="submit" class="btn btn--ghost">Crear y editar</button>
            </form>
          </details>
        </div>
      <?php endforeach; ?>
    </section>
  <?php endforeach; ?>
</main>
<?php require __DIR__ . '/inc/footer.php'; ?>
