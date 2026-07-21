<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/statuses.php';

/**
 * Tokens de acceso al portal. Son reutilizables: el cliente puede volver a
 * abrir el mismo link del mail las veces que quiera hasta que venza. En la
 * base nunca se guarda el token, solo su sha256.
 */

function magic_link_create(PDO $pdo, int $clientId, int $days = MAGIC_LINK_DAYS): string
{
    $token = bin2hex(random_bytes(32));
    $stmt  = $pdo->prepare('INSERT INTO magic_link_tokens (client_id, token_hash, expires_at) VALUES (?, ?, ?)');
    $stmt->execute([
        $clientId,
        hash('sha256', $token),
        (new DateTimeImmutable('+' . $days . ' days'))->format('Y-m-d H:i:s'),
    ]);
    return $token;
}

/**
 * URL de acceso. $next es el destino después del login; login.php solo acepta
 * rutas internas de /portal, así que no sirve para redirigir afuera.
 */
function magic_link_url(string $token, ?string $next = null): string
{
    $url = PORTAL_BASE_URL . '/login.php?token=' . urlencode($token);
    if ($next !== null && $next !== '') {
        $url .= '&next=' . urlencode($next);
    }
    return $url;
}

/**
 * Valida el destino post-login. Solo rutas absolutas dentro de /portal/:
 * evita que un `next` armado a mano mande al cliente a otro sitio.
 */
function magic_link_safe_next(string $next): ?string
{
    /* Exigir el prefijo /portal/ ya descarta `//host` y `/\host`, que el
       navegador leería como otro dominio. La barra invertida se rechaza igual
       por las dudas de que algo normalice la ruta antes del redirect. */
    if (strncmp($next, '/portal/', 8) !== 0 || strpos($next, '\\') !== false) {
        return null;
    }
    return $next;
}
