<?php
// backend/lib/auth.php
require_once __DIR__ . '/json.php';

function start_session() {
  if (session_status() === PHP_SESSION_NONE) {
    // Asegura que el path coincida con la carpeta base de tu app
    $cookie_path = '/Almacen'; // <-- ajusta si tu app vive en otra carpeta
    session_name('ARQSESSID');
    session_set_cookie_params([
      'lifetime' => 0,
      'path'     => $cookie_path,
      'domain'   => '',       // mismo host
      'secure'   => false,    // true si usas HTTPS
      'httponly' => true,
      'samesite' => 'Lax',
    ]);
    session_start();
  }
}

function require_login() {
  start_session();
  if (empty($_SESSION['user'])) {
    json_err('No autenticado', 401);
  }
  return $_SESSION['user'];
}

function has_perm($key) {
  start_session();
  $perms = $_SESSION['perms'] ?? [];
  return in_array($key, $perms, true);
}

function require_perm($key) {
  require_login();
  if (!has_perm($key)) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'No autorizado']);
    exit;
  }
}
