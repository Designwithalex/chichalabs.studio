<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth-portal.php';

portal_logout();
header('Location: /portal/index.php');
exit;
