<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('empleados.editar');
require_login();

$d = json_decode(file_get_contents('php://input'), true) ?? [];
$id = (int)($d['id'] ?? 0);
if ($id<=0) json_err('id requerido', 400);

$campos=[]; $args=[];
foreach (['nombre'=>'Nombre','username'=>'Username','cargoId'=>'CargoId','estado'=>'Estado'] as $k=>$col){
  if (array_key_exists($k,$d)) { $campos[]="$col=?"; $args[]=$d[$k]; }
}
if (array_key_exists('password',$d) && $d['password']!=='') {
  $campos[] = "PasswordHash=?";
  $args[]   = password_hash($d['password'], PASSWORD_BCRYPT);
}
if (!$campos) json_err('nada para actualizar', 400);

$args[]=$id;
try{
  $st = pdo()->prepare("UPDATE dbo.Empleado SET ".implode(',', $campos)." WHERE Id=?");
  $st->execute($args);
  json_ok(['msg'=>'Empleado actualizado']);
}catch(Throwable $e){
  json_err('No se pudo actualizar', 400, ['detalle'=>$e->getMessage()]);
}
