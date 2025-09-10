<?php
// backend/api/login.php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';

header('Content-Type: application/json; charset=utf-8');

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$username = trim((string)($data['username'] ?? ''));
$password = (string)($data['password'] ?? '');

if ($username === '' || $password === '') {
  json_err('username y password requeridos', 400);
}

$pdo = pdo();
$sql = "
  SELECT TOP 1
    e.Id,
    e.Username,
    e.Estado,
    e.CargoId,
    e.PasswordHash,
    c.Nombre AS CargoNombre
  FROM dbo.Empleado e
  LEFT JOIN dbo.Cargo c ON c.Id = e.CargoId
  WHERE e.Username = ?
";
$stmt = $pdo->prepare($sql);
$stmt->execute([$username]);
$u = $stmt->fetch();

$ok = false;
if ($u && !empty($u['PasswordHash']) && strlen($u['PasswordHash']) >= 50) {
  $ok = password_verify($password, $u['PasswordHash']);
}

if (!$u || (int)$u['Estado'] !== 1 || !$ok) {
  json_err('Credenciales inválidas', 401);
}

/* ==== Cargar permisos del rol (Cargo) ==== */
$perms = [];
if (!empty($u['CargoId'])) {
  $permStmt = $pdo->prepare("
    SELECT p.Clave
    FROM dbo.CargoPermiso cp
    JOIN dbo.Permiso p ON p.Id = cp.PermisoId
    WHERE cp.CargoId = ?
  ");
  $permStmt->execute([(int)$u['CargoId']]);
  $perms = array_column($permStmt->fetchAll(), 'Clave');
}

/* ==== Sesión ==== */
start_session();
session_regenerate_id(true); // mitiga fijación de sesión

$_SESSION['user'] = [
  'id'          => (int)$u['Id'],
  'username'    => $u['Username'],
  'cargoId'     => (int)$u['CargoId'],
  'cargoNombre' => $u['CargoNombre'] ?? ''
];
$_SESSION['perms'] = $perms;

/* ==== Respuesta ==== */
json_ok([
  'user'  => $_SESSION['user'],
  'perms' => $perms
]);
