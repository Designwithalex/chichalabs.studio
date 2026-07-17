<?php
declare(strict_types=1);
/** Requiere que el script que lo incluye ya haya hecho portal_session_start(). */
?><!DOCTYPE html>
<html lang="es-AR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title><?= isset($pageTitle) ? htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') . ' — ' : '' ?>Portal — ChichaLabs Studio</title>
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/proposal-calculator.css">
  <link rel="stylesheet" href="/portal/css/portal.css">
</head>
<body class="portal-body">
  <header class="portal-topbar">
    <a href="/portal/dashboard.php" class="nav__monogram">[ CL ]</a>
    <?php if (portal_client_id() !== null): ?>
      <a href="/portal/logout.php" class="btn btn--text">Salir</a>
    <?php endif; ?>
  </header>
