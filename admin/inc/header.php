<?php
declare(strict_types=1);
/** Requiere que el script que lo incluye ya haya hecho admin_session_start(). */
?><!DOCTYPE html>
<html lang="es-AR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title><?= isset($pageTitle) ? htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') . ' — ' : '' ?>Admin — ChichaLabs Studio</title>
  <meta name="theme-color" content="#0A0A0B">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/tokens.css">
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/proposal-calculator.css">
  <link rel="stylesheet" href="/admin/css/admin.css">
</head>
<body class="admin-body">
<?php if (admin_id() !== null): ?>
  <header class="admin-topbar">
    <a href="/admin/dashboard.php" class="nav__monogram">[ CL ] Admin</a>
    <span class="admin-topbar__user">
      <?= htmlspecialchars($_SESSION['admin_username'] ?? '', ENT_QUOTES, 'UTF-8') ?>
      · <a href="/admin/logout.php">Salir</a>
    </span>
  </header>
<?php endif; ?>
