<?php
declare(strict_types=1);

/**
 * Protección CSRF simple basada en sesión.
 * Requiere que ya haya una sesión activa (portal_session_start() o admin_session_start()).
 */

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8') . '">';
}

function csrf_verify(?string $token): bool
{
    return is_string($token) && $token !== '' && !empty($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Corta la ejecución con 403 si el POST no trae un csrf_token válido.
 */
function csrf_require(): void
{
    $token = $_POST['csrf_token'] ?? null;
    if (!csrf_verify($token)) {
        http_response_code(403);
        exit('Solicitud inválida (CSRF). Volvé a intentar desde el formulario.');
    }
}
