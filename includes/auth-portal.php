<?php
declare(strict_types=1);

/**
 * Sesión del PORTAL de clientes. Usa un nombre de cookie y un path propios
 * (separados de /admin) para que ambas sesiones nunca se pisen en el mismo navegador.
 */

function portal_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('chicha_portal_sess');
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/portal',
        'secure'   => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function portal_login(int $clientId): void
{
    portal_session_start();
    session_regenerate_id(true);
    $_SESSION['client_id'] = $clientId;
}

function portal_logout(): void
{
    portal_session_start();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

function portal_client_id(): ?int
{
    portal_session_start();
    return isset($_SESSION['client_id']) ? (int) $_SESSION['client_id'] : null;
}

/**
 * Corta la ejecución y redirige a login si no hay cliente logueado.
 * Devuelve el client_id cuando sí lo hay.
 */
function portal_require_auth(): int
{
    $id = portal_client_id();
    if ($id === null) {
        header('Location: /portal/index.php');
        exit;
    }
    return $id;
}
