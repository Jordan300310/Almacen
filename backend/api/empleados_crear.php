<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';

header('Content-Type: application/json; charset=utf-8');

$d = json_decode(file_get_contents('php://input'), true) ?? [];
$nombre   = trim($d['nombre'] ?? '');
$username = trim($d['username'] ?? '');
$password = (string)($d['password'] ?? '');
$cargoId  = (int)($d['cargoId'] ?? 0);
$estado   = isset($d['estado']) ? (int)$d['estado'] : 1;

if ($nombre==='' || $username==='' || $cargoId<=0) {
  json_err('nombre, username y cargoId requeridos', 400);
}

$pdo = pdo();

try {
  // --- Protegemos el "primer uso" con una transacción ---
  $pdo->beginTransaction();

  // Contamos con bloqueo para que no haya carrera creando el primer usuario
  $cnt = (int)$pdo
    ->query("SELECT COUNT(*) FROM dbo.Empleado WITH (HOLDLOCK, UPDLOCK)")
    ->fetchColumn();

  $isFirst = ($cnt === 0);

  if (!$isFirst) {
    // Modo normal: exige login + permiso
    $pdo->commit(); // cerramos esta tx antes de pasar a la ruta normal
    require_perm('empleados.crear');

    // Volvemos a abrir transacción solo para el INSERT
    $pdo->beginTransaction();
  } else {
    // Modo "primer uso": forzamos rol ADMIN y estado activo
    // (asegura que exista el cargo ADMIN)
    $pdo->exec("IF NOT EXISTS (SELECT 1 FROM dbo.Cargo WHERE Nombre = N'ADMIN')
                INSERT INTO dbo.Cargo (Nombre, Descripcion) VALUES (N'ADMIN', N'Acceso total')");
    $cargoAdminId = (int)$pdo->query("SELECT Id FROM dbo.Cargo WHERE Nombre = N'ADMIN'")->fetchColumn();
    $cargoId = $cargoAdminId; // ignoramos el cargoId que venga del cliente
    $estado  = 1;
  }
  // Hash de contraseña (opcionalmente puedes exigir que no sea vacío)
  $hash = $password !== '' ? password_hash($password, PASSWORD_BCRYPT) : null;
  // Insert
  $st = $pdo->prepare("
    INSERT INTO dbo.Empleado (Nombre, Username, PasswordHash, CargoId, Estado)
    VALUES (?,?,?,?,?)
  ");
  $st->execute([$nombre, $username, $hash, $cargoId, $estado]);
  // Id insertado
  $id = (int)$pdo->query("SELECT SCOPE_IDENTITY() AS Id")->fetch()['Id'];
  $pdo->commit();
  json_ok(['id'=>$id, 'primerUso'=>$isFirst, 'msg'=>'Empleado creado']);
} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  // Si fue por username duplicado u otra restricción:
  json_err('No se pudo crear', 400, ['detalle'=>$e->getMessage()]);
}
