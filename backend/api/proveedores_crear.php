<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('proveedores.crear');
require_login();

$d = json_decode(file_get_contents('php://input'), true) ?? [];
$nombre = trim($d['nombre'] ?? '');
$tel    = trim($d['telefono'] ?? '');
$email  = trim($d['email'] ?? '');
$dir    = trim($d['direccion'] ?? '');

if ($nombre==='') json_err('nombre requerido', 400);

try {
  $ins = pdo()->prepare("INSERT INTO dbo.Proveedor(Nombre,Telefono,Email,Direccion) VALUES(?,?,?,?)");
  $ins->execute([$nombre,$tel ?: null,$email ?: null,$dir ?: null]);
  $id = (int)pdo()->query("SELECT SCOPE_IDENTITY() AS Id")->fetch()['Id'];
  json_ok(['id'=>$id,'msg'=>'Proveedor creado']);
} catch(Throwable $e){
  json_err('No se pudo crear', 400, ['detalle'=>$e->getMessage()]);
}
