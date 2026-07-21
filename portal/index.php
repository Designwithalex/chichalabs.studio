<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth-portal.php';
require_once __DIR__ . '/../includes/csrf.php';
require_once __DIR__ . '/../includes/mailer.php';
require_once __DIR__ . '/../includes/magic-link.php';

portal_session_start();

if (portal_client_id() !== null) {
    header('Location: /portal/dashboard.php');
    exit;
}

function magic_link_rate_limited(PDO $pdo, string $email): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) AS c FROM magic_link_requests WHERE email = ? AND requested_at > (NOW() - INTERVAL 60 SECOND)'
    );
    $stmt->execute([$email]);
    return (int) $stmt->fetch()['c'] > 0;
}

function magic_link_record_request(PDO $pdo, string $email): void
{
    $stmt = $pdo->prepare('INSERT INTO magic_link_requests (email) VALUES (?)');
    $stmt->execute([$email]);
}

$sent  = false;
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_require();

    $pdo   = db();
    $email = trim((string) ($_POST['email'] ?? ''));

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Ingresá un email válido.';
    } elseif (magic_link_rate_limited($pdo, $email)) {
        // Mismo mensaje genérico — no revelamos que hubo rate limiting.
        $sent = true;
    } else {
        magic_link_record_request($pdo, $email);

        $stmt = $pdo->prepare('SELECT id, name, email FROM clients WHERE email = ?');
        $stmt->execute([$email]);
        $client = $stmt->fetch();

        if ($client) {
            $token = magic_link_create($pdo, (int) $client['id']);
            send_magic_link_mail($client['email'], $client['name'], magic_link_url($token));
        }

        // Mensaje genérico exista o no el cliente — no confirmamos ni negamos.
        $sent = true;
    }
}

$pageTitle = 'Ingresar';
require __DIR__ . '/inc/header.php';
?>
<main class="container portal-auth">
  <h1>Portal de clientes</h1>
  <p>Ingresá el email con el que te registramos y te mandamos un link de acceso.</p>

  <?php if ($sent): ?>
    <p class="portal-alert portal-alert--ok">Si el mail está registrado, en unos minutos te llega el link. Revisá también la carpeta de spam.</p>
  <?php else: ?>
    <?php if ($error !== ''): ?>
      <p class="portal-alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
    <?php endif; ?>
    <form method="POST" class="portal-form">
      <?= csrf_field() ?>
      <label>Email <input type="email" name="email" required autofocus autocomplete="email"></label>
      <button type="submit" class="btn btn--ghost">Enviarme el link</button>
    </form>
  <?php endif; ?>
</main>
<?php require __DIR__ . '/inc/footer.php'; ?>
