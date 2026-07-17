<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth-admin.php';
require_once __DIR__ . '/../includes/csrf.php';
require_once __DIR__ . '/../includes/statuses.php';

admin_session_start();
admin_require_auth();

$pdo = db();

$proposalId = (int) ($_GET['id'] ?? 0);

function load_proposal(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(
        'SELECT p.*, pr.name AS project_name, pr.id AS project_id, c.name AS client_name, c.id AS client_id
         FROM proposals p
         JOIN projects pr ON pr.id = p.project_id
         JOIN clients c ON c.id = pr.client_id
         WHERE p.id = ?'
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

$proposal = load_proposal($pdo, $proposalId);

if (!$proposal) {
    http_response_code(404);
    $pageTitle = 'No encontrada';
    require __DIR__ . '/inc/header.php';
    echo '<main class="container"><p>Propuesta no encontrada.</p></main>';
    require __DIR__ . '/inc/footer.php';
    exit;
}

$isAccepted = $proposal['status'] === 'aceptada';

/* ============================================================
   POST — mutaciones (bloqueadas si la propuesta ya fue aceptada)
   ============================================================ */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_require();

    if ($isAccepted) {
        header('Location: /admin/propuesta-editor.php?id=' . $proposalId);
        exit;
    }

    $action = (string) ($_POST['action'] ?? '');

    if ($action === 'update_proposal') {
        $hourlyRate = (float) ($_POST['hourly_rate'] ?? 0);
        $stmt = $pdo->prepare('UPDATE proposals SET title = ?, currency = ?, hourly_rate = ?, payment_terms = ?, validity_days = ?, general_notes = ? WHERE id = ?');
        $stmt->execute([
            trim((string) ($_POST['title'] ?? '')),
            trim((string) ($_POST['currency'] ?? '')) ?: 'ARS',
            $hourlyRate > 0 ? $hourlyRate : null,
            trim((string) ($_POST['payment_terms'] ?? '')) ?: null,
            (int) ($_POST['validity_days'] ?? 15),
            trim((string) ($_POST['general_notes'] ?? '')) ?: null,
            $proposalId,
        ]);
        /* Cambiar el valor hora recalcula el precio de todos los módulos que
           tengan horas cargadas (precio = valor hora × horas). */
        if ($hourlyRate > 0) {
            $pdo->prepare('UPDATE proposal_modules SET price_min = ROUND(hours * ?, 2), price_max = ROUND(hours * ?, 2) WHERE proposal_id = ? AND hours IS NOT NULL')
                ->execute([$hourlyRate, $hourlyRate, $proposalId]);
        }
    } elseif ($action === 'add_module' || $action === 'update_module') {
        $moduleNumber = (int) ($_POST['module_number'] ?? 0);
        /* El precio ya no se escribe a mano: sale de horas × valor hora de la propuesta. */
        $hours = (float) ($_POST['hours'] ?? 0);
        $rate  = (float) ($proposal['hourly_rate'] ?? 0);
        $price = round($hours * $rate, 2);
        $fields = [
            trim((string) ($_POST['name'] ?? '')),
            trim((string) ($_POST['category'] ?? '')),
            trim((string) ($_POST['description'] ?? '')) ?: null,
            $hours,
            $price,
            $price,
            ((string) ($_POST['billing_type'] ?? '')) === 'monthly' ? 'monthly' : 'once',
            trim((string) ($_POST['delivery_estimate'] ?? '')) ?: null,
            trim((string) ($_POST['notes'] ?? '')) ?: null,
            trim((string) ($_POST['external_cost_note'] ?? '')) ?: null,
            isset($_POST['is_locked']) ? 1 : 0,
            isset($_POST['default_checked']) ? 1 : 0,
            $moduleNumber,
        ];

        if ($action === 'add_module') {
            $stmt = $pdo->prepare(
                'INSERT INTO proposal_modules
                 (proposal_id, module_number, name, category, description, hours, price_min, price_max, billing_type, delivery_estimate, notes, external_cost_note, is_locked, default_checked, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute(array_merge([$proposalId, $moduleNumber], $fields));
        } else {
            $moduleId = (int) ($_POST['module_id'] ?? 0);
            $stmt = $pdo->prepare(
                'UPDATE proposal_modules SET
                 module_number = ?, name = ?, category = ?, description = ?, hours = ?, price_min = ?, price_max = ?,
                 billing_type = ?, delivery_estimate = ?, notes = ?, external_cost_note = ?, is_locked = ?, default_checked = ?, sort_order = ?
                 WHERE id = ? AND proposal_id = ?'
            );
            $stmt->execute(array_merge([$moduleNumber], $fields, [$moduleId, $proposalId]));
        }
    } elseif ($action === 'delete_module') {
        $stmt = $pdo->prepare('DELETE FROM proposal_modules WHERE id = ? AND proposal_id = ?');
        $stmt->execute([(int) ($_POST['module_id'] ?? 0), $proposalId]);
    } elseif ($action === 'add_note') {
        $question = trim((string) ($_POST['question'] ?? ''));
        if ($question !== '') {
            $stmt = $pdo->prepare('INSERT INTO proposal_internal_notes (proposal_id, question) VALUES (?, ?)');
            $stmt->execute([$proposalId, $question]);
        }
    } elseif ($action === 'toggle_note') {
        $stmt = $pdo->prepare('UPDATE proposal_internal_notes SET resolved = NOT resolved WHERE id = ? AND proposal_id = ?');
        $stmt->execute([(int) ($_POST['note_id'] ?? 0), $proposalId]);
    } elseif ($action === 'delete_note') {
        $stmt = $pdo->prepare('DELETE FROM proposal_internal_notes WHERE id = ? AND proposal_id = ?');
        $stmt->execute([(int) ($_POST['note_id'] ?? 0), $proposalId]);
    } elseif ($action === 'mark_sent') {
        $stmt = $pdo->prepare("UPDATE proposals SET status = 'enviada', sent_at = NOW() WHERE id = ?");
        $stmt->execute([$proposalId]);
    }

    header('Location: /admin/propuesta-editor.php?id=' . $proposalId);
    exit;
}

/* ============================================================
   DATA para render
   ============================================================ */
$stmt = $pdo->prepare('SELECT * FROM proposal_modules WHERE proposal_id = ? ORDER BY sort_order ASC, module_number ASC');
$stmt->execute([$proposalId]);
$modules = $stmt->fetchAll();

$stmt = $pdo->prepare('SELECT * FROM proposal_internal_notes WHERE proposal_id = ? ORDER BY resolved ASC, sort_order ASC, id ASC');
$stmt->execute([$proposalId]);
$notes = $stmt->fetchAll();

$editModuleId = isset($_GET['edit_module']) ? (int) $_GET['edit_module'] : null;
$editModule   = null;
if ($editModuleId) {
    foreach ($modules as $m) {
        if ((int) $m['id'] === $editModuleId) { $editModule = $m; break; }
    }
}
$nextModuleNumber = 1;
foreach ($modules as $m) { $nextModuleNumber = max($nextModuleNumber, (int) $m['module_number'] + 1); }

$allClosed = true;
$hasRelevantModule = false;
foreach ($modules as $m) {
    if ($m['is_locked'] || $m['default_checked']) {
        $hasRelevantModule = true;
        if ((float) $m['price_min'] !== (float) $m['price_max']) { $allClosed = false; }
    }
}
$rangeStatus = $hasRelevantModule && $allClosed ? 'Precio cerrado' : 'En rango';

$proposalUrl = PORTAL_BASE_URL . '/propuesta.php?id=' . $proposalId;

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
    'mode'          => 'admin',
    'status'        => $proposal['status'],
    'currency'      => $proposal['currency'],
    'payment_terms' => $proposal['payment_terms'],
    'validity_days' => (int) $proposal['validity_days'],
    'sent_at'       => $proposal['sent_at'],
    'general_notes' => $proposal['general_notes'],
];

$pageTitle = $proposal['title'];
require __DIR__ . '/inc/header.php';
?>
<main class="container admin-editor">
  <p class="admin-breadcrumb">
    <a href="/admin/dashboard.php">← Dashboard</a> ·
    <?= htmlspecialchars($proposal['client_name'], ENT_QUOTES, 'UTF-8') ?> / <?= htmlspecialchars($proposal['project_name'], ENT_QUOTES, 'UTF-8') ?>
  </p>

  <div class="admin-editor__head">
    <h1><?= htmlspecialchars($proposal['title'], ENT_QUOTES, 'UTF-8') ?></h1>
    <span class="admin-badge admin-badge--<?= htmlspecialchars($proposal['status'], ENT_QUOTES, 'UTF-8') ?>">
      <?= htmlspecialchars(PROPOSAL_STATUS_LABELS[$proposal['status']] ?? $proposal['status'], ENT_QUOTES, 'UTF-8') ?>
    </span>
    <span class="admin-badge admin-badge--range"><?= htmlspecialchars($rangeStatus, ENT_QUOTES, 'UTF-8') ?></span>
  </div>

  <?php if ($isAccepted): ?>
    <div class="admin-panel">
      <p><strong>Esta propuesta ya fue aceptada</strong> el <?= htmlspecialchars((string) $proposal['accepted_at'], ENT_QUOTES, 'UTF-8') ?> — quedó en solo lectura.</p>
      <p>Total único aceptado: <?= $proposal['accepted_total_once'] !== null ? htmlspecialchars($proposal['currency'] . ' ' . number_format((float) $proposal['accepted_total_once'], 0, ',', '.'), ENT_QUOTES, 'UTF-8') : '—' ?></p>
      <p>Total mensual aceptado: <?= $proposal['accepted_total_monthly'] !== null ? htmlspecialchars($proposal['currency'] . ' ' . number_format((float) $proposal['accepted_total_monthly'], 0, ',', '.'), ENT_QUOTES, 'UTF-8') : '—' ?></p>
    </div>
  <?php else: ?>

    <div class="admin-panel">
      <p><strong>Link para el cliente:</strong>
        <a href="<?= htmlspecialchars($proposalUrl, ENT_QUOTES, 'UTF-8') ?>" target="_blank" rel="noopener noreferrer"><?= htmlspecialchars($proposalUrl, ENT_QUOTES, 'UTF-8') ?></a>
      </p>
      <?php if ($proposal['status'] === 'borrador'): ?>
        <form method="POST">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="mark_sent">
          <button type="submit" class="btn btn--ghost">Marcar como enviada</button>
        </form>
      <?php else: ?>
        <form method="POST">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="mark_sent">
          <button type="submit" class="btn btn--text">Reenviar (renueva validez desde hoy)</button>
        </form>
      <?php endif; ?>
    </div>

    <section class="admin-section">
      <h2>Datos de la propuesta</h2>
      <form method="POST" class="admin-form">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="update_proposal">
        <label>Título <input type="text" name="title" value="<?= htmlspecialchars($proposal['title'], ENT_QUOTES, 'UTF-8') ?>" required></label>
        <label>Moneda <input type="text" name="currency" value="<?= htmlspecialchars($proposal['currency'], ENT_QUOTES, 'UTF-8') ?>" required></label>
        <label>Valor hora <input type="number" name="hourly_rate" step="any" min="0" value="<?= htmlspecialchars((string) ($proposal['hourly_rate'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" placeholder="Ej: 30"></label>
        <p class="admin-hint">El precio de cada módulo se calcula como <strong>valor hora × horas</strong>. Al guardar, se recalculan todos los módulos con este valor.</p>
        <label>Condiciones de pago <textarea name="payment_terms" rows="2"><?= htmlspecialchars((string) $proposal['payment_terms'], ENT_QUOTES, 'UTF-8') ?></textarea></label>
        <label>Validez (días) <input type="number" name="validity_days" min="1" value="<?= (int) $proposal['validity_days'] ?>" required></label>
        <label>Notas generales <textarea name="general_notes" rows="2"><?= htmlspecialchars((string) $proposal['general_notes'], ENT_QUOTES, 'UTF-8') ?></textarea></label>
        <button type="submit" class="btn btn--ghost">Guardar datos</button>
      </form>
    </section>

    <section class="admin-section">
      <h2><?= $editModule ? 'Editar módulo' : 'Nuevo módulo' ?></h2>
      <form method="POST" class="admin-form">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="<?= $editModule ? 'update_module' : 'add_module' ?>">
        <?php if ($editModule): ?><input type="hidden" name="module_id" value="<?= (int) $editModule['id'] ?>"><?php endif; ?>

        <label>Número <input type="number" name="module_number" min="1" value="<?= $editModule ? (int) $editModule['module_number'] : $nextModuleNumber ?>" required></label>
        <label>Nombre <input type="text" name="name" value="<?= htmlspecialchars($editModule['name'] ?? '', ENT_QUOTES, 'UTF-8') ?>" required></label>
        <label>Categoría <input type="text" name="category" value="<?= htmlspecialchars($editModule['category'] ?? '', ENT_QUOTES, 'UTF-8') ?>" required></label>
        <label>Descripción (bullets, uno por línea con "- ")
          <textarea name="description" rows="4" placeholder="- Item uno&#10;- Item dos"><?= htmlspecialchars($editModule['description'] ?? '', ENT_QUOTES, 'UTF-8') ?></textarea>
        </label>
        <label>Horas <input type="number" name="hours" id="module-hours" step="any" min="0" value="<?= htmlspecialchars((string) ($editModule['hours'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" required></label>
        <p class="admin-hint">Precio calculado: <strong id="module-price-preview">—</strong> <span class="admin-muted">(valor hora × horas)</span></p>
        <label>Tipo de cobro
          <select name="billing_type">
            <option value="once" <?= (($editModule['billing_type'] ?? 'once') === 'once') ? 'selected' : '' ?>>Costo único</option>
            <option value="monthly" <?= (($editModule['billing_type'] ?? '') === 'monthly') ? 'selected' : '' ?>>Mensual</option>
          </select>
        </label>
        <label>Plazo de entrega <input type="text" name="delivery_estimate" value="<?= htmlspecialchars($editModule['delivery_estimate'] ?? '', ENT_QUOTES, 'UTF-8') ?>" placeholder="2-3 semanas"></label>
        <label>Nota opcional <textarea name="notes" rows="2"><?= htmlspecialchars($editModule['notes'] ?? '', ENT_QUOTES, 'UTF-8') ?></textarea></label>
        <label>Costo externo opcional <textarea name="external_cost_note" rows="2"><?= htmlspecialchars($editModule['external_cost_note'] ?? '', ENT_QUOTES, 'UTF-8') ?></textarea></label>
        <label class="admin-check"><input type="checkbox" name="is_locked" <?= !empty($editModule['is_locked']) ? 'checked' : '' ?>> Obligatorio (el cliente no lo puede destildar)</label>
        <label class="admin-check"><input type="checkbox" name="default_checked" <?= ($editModule === null || !empty($editModule['default_checked'])) ? 'checked' : '' ?>> Tildado por defecto</label>

        <div class="admin-form__actions">
          <button type="submit" class="btn btn--ghost"><?= $editModule ? 'Guardar cambios' : 'Agregar módulo' ?></button>
          <?php if ($editModule): ?><a href="/admin/propuesta-editor.php?id=<?= $proposalId ?>" class="btn btn--text">Cancelar</a><?php endif; ?>
        </div>
      </form>
    </section>

    <script>
    (function () {
      var rate = <?= (float) ($proposal['hourly_rate'] ?? 0) ?>;
      var cur  = <?= json_encode($proposal['currency'], JSON_HEX_TAG) ?>;
      var input = document.getElementById('module-hours');
      var out   = document.getElementById('module-price-preview');
      if (!input || !out) return;
      function upd() {
        if (rate <= 0) { out.textContent = 'definí el valor hora arriba'; return; }
        var h = parseFloat(input.value) || 0;
        var p = Math.round(h * rate * 100) / 100;
        out.textContent = cur + ' ' + p.toLocaleString('es-AR');
      }
      input.addEventListener('input', upd);
      upd();
    })();
    </script>

    <section class="admin-section">
      <h2>Módulos (<?= count($modules) ?>)</h2>
      <table class="admin-table">
        <thead>
          <tr><th>#</th><th>Nombre</th><th>Categoría</th><th>Horas</th><th>Precio</th><th>Cobro</th><th>Obligatorio</th><th></th></tr>
        </thead>
        <tbody>
          <?php foreach ($modules as $m): ?>
            <tr>
              <td><?= (int) $m['module_number'] ?></td>
              <td><?= htmlspecialchars($m['name'], ENT_QUOTES, 'UTF-8') ?></td>
              <td><?= htmlspecialchars($m['category'], ENT_QUOTES, 'UTF-8') ?></td>
              <td><?= $m['hours'] !== null ? htmlspecialchars(rtrim(rtrim(number_format((float) $m['hours'], 2, '.', ''), '0'), '.') . ' h', ENT_QUOTES, 'UTF-8') : '—' ?></td>
              <td><?= htmlspecialchars($proposal['currency'] . ' ' . number_format((float) $m['price_min'], 0, ',', '.') . (($m['price_min'] != $m['price_max']) ? ' – ' . number_format((float) $m['price_max'], 0, ',', '.') : ''), ENT_QUOTES, 'UTF-8') ?></td>
              <td><?= $m['billing_type'] === 'monthly' ? 'Mensual' : 'Único' ?></td>
              <td><?= $m['is_locked'] ? 'Sí' : 'No' ?></td>
              <td class="admin-table__actions">
                <a href="/admin/propuesta-editor.php?id=<?= $proposalId ?>&edit_module=<?= (int) $m['id'] ?>">Editar</a>
                <form method="POST" onsubmit="return confirm('¿Eliminar este módulo?');">
                  <?= csrf_field() ?>
                  <input type="hidden" name="action" value="delete_module">
                  <input type="hidden" name="module_id" value="<?= (int) $m['id'] ?>">
                  <button type="submit" class="admin-link-btn">Eliminar</button>
                </form>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </section>

    <section class="admin-section">
      <h2>Preguntas pendientes (solo admin)</h2>
      <form method="POST" class="admin-form admin-form--inline">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="add_note">
        <label>Pregunta <input type="text" name="question" required></label>
        <button type="submit" class="btn btn--ghost">Agregar</button>
      </form>
      <ul class="admin-notes">
        <?php foreach ($notes as $note): ?>
          <li class="<?= $note['resolved'] ? 'is-resolved' : '' ?>">
            <span><?= htmlspecialchars($note['question'], ENT_QUOTES, 'UTF-8') ?></span>
            <span class="admin-notes__actions">
              <form method="POST">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="toggle_note">
                <input type="hidden" name="note_id" value="<?= (int) $note['id'] ?>">
                <button type="submit" class="admin-link-btn"><?= $note['resolved'] ? 'Reabrir' : 'Resolver' ?></button>
              </form>
              <form method="POST">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="delete_note">
                <input type="hidden" name="note_id" value="<?= (int) $note['id'] ?>">
                <button type="submit" class="admin-link-btn">Eliminar</button>
              </form>
            </span>
          </li>
        <?php endforeach; ?>
        <?php if (!$notes): ?><li class="admin-empty">Sin preguntas pendientes.</li><?php endif; ?>
      </ul>
    </section>
  <?php endif; ?>

  <section class="admin-section">
    <h2>Vista previa — así la ve el cliente</h2>
    <div id="proposal-app"></div>
  </section>
</main>

<script>
  window.MODULES = <?= json_encode($jsModules, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) ?>;
  window.PROPOSAL_META = <?= json_encode($jsMeta, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) ?>;
</script>
<script src="/admin/js/proposal-calculator.js"></script>
<?php require __DIR__ . '/inc/footer.php'; ?>
