<?php
declare(strict_types=1);

/**
 * Sesión del PANEL ADMIN. Cookie y path propios (/admin), separados del portal.
 */

function admin_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('chicha_admin_sess');
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/admin',
        'secure'   => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function admin_login(int $adminId, string $username): void
{
    admin_session_start();
    session_regenerate_id(true);
    $_SESSION['admin_id']       = $adminId;
    $_SESSION['admin_username'] = $username;
}

function admin_logout(): void
{
    admin_session_start();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

function admin_id(): ?int
{
    admin_session_start();
    return isset($_SESSION['admin_id']) ? (int) $_SESSION['admin_id'] : null;
}

function admin_require_auth(): int
{
    $id = admin_id();
    if ($id === null) {
        header('Location: /admin/login.php');
        exit;
    }
    return $id;
}
