<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('proveedores.editar');
require_login();

$d = json_decode(file_get_contents('php://input'), true) ?? [];
$id = (int)($d['id'] ?? 0);
if ($id<=0) json_err('id requerido', 400);

$campos=[]; $args=[];
foreach (['nombre'=>'Nombre','telefono'=>'Telefono','email'=>'Email','direccion'=>'Direccion','estado'=>'Estado'] as $k=>$col){
  if (array_key_exists($k,$d)) { $campos[]="$col=?"; $args[]=$d[$k]; }
}
if (!$campos) json_err('nada para actualizar', 400);
$args[]=$id;

try{
  $st = pdo()->prepare("UPDATE dbo.Proveedor SET ".implode(',', $campos)." WHERE Id=?");
  $st->execute($args);
  json_ok(['msg'=>'Proveedor actualizado']);
}catch(Throwable $e){ json_err('No se pudo actualizar', 400, ['detalle'=>$e->getMessage()]); }
