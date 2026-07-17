<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth-admin.php';
require_once __DIR__ . '/../includes/csrf.php';

admin_session_start();

if (admin_id() !== null) {
    header('Location: /admin/dashboard.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_require();

    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    $stmt = db()->prepare('SELECT id, username, password_hash FROM admin_users WHERE username = ?');
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    if ($admin && password_verify($password, $admin['password_hash'])) {
        admin_login((int) $admin['id'], (string) $admin['username']);
        header('Location: /admin/dashboard.php');
        exit;
    }

    $error = 'Usuario o contraseña incorrectos.';
}

$pageTitle = 'Ingresar';
require __DIR__ . '/inc/header.php';
?>
<main class="container admin-auth">
  <div class="admin-auth__card">
    <h1 class="admin-auth__title">[ CL ] Admin</h1>
    <p class="admin-auth__subtitle">Panel interno de propuestas y clientes.</p>

    <?php if ($error !== ''): ?>
      <p class="admin-alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
    <?php endif; ?>

    <form method="POST" class="admin-form admin-auth__form">
      <?= csrf_field() ?>
      <label>
        Usuario
        <input type="text" name="username" autocomplete="username" required autofocus>
      </label>
      <label>
        Contraseña
        <input type="password" name="password" autocomplete="current-password" required>
      </label>
      <button type="submit" class="btn btn--ghost">Ingresar</button>
    </form>
  </div>
</main>
<?php require __DIR__ . '/inc/footer.php'; ?>
