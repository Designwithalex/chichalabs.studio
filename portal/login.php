<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth-portal.php';
require_once __DIR__ . '/../includes/magic-link.php';

portal_session_start();

$token = (string) ($_GET['token'] ?? '');
$error = '';

if ($token === '') {
    $error = 'Este link no es válido.';
} else {
    $pdo  = db();
    $hash = hash('sha256', $token);

    /* El token es reutilizable hasta que vence: el cliente puede volver al
       mismo link del mail las veces que quiera. `used_at` queda solo como
       registro del primer uso, no invalida nada. */
    $stmt = $pdo->prepare('SELECT client_id FROM magic_link_tokens WHERE token_hash = ? AND expires_at > NOW()');
    $stmt->execute([$hash]);
    $row = $stmt->fetch();

    if ($row) {
        $pdo->prepare('UPDATE magic_link_tokens SET used_at = COALESCE(used_at, NOW()) WHERE token_hash = ?')
            ->execute([$hash]);

        portal_login((int) $row['client_id']);

        $next = magic_link_safe_next((string) ($_GET['next'] ?? ''));
        header('Location: ' . ($next ?? '/portal/dashboard.php'));
        exit;
    }

    $error = 'Este link ya venció. Pedí uno nuevo.';
}

$pageTitle = 'Ingresar';
require __DIR__ . '/inc/header.php';
?>
<main class="container portal-auth">
  <p class="portal-alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
  <a href="/portal/index.php" class="btn btn--ghost">Pedir un nuevo link</a>
</main>
<?php require __DIR__ . '/inc/footer.php'; ?>
