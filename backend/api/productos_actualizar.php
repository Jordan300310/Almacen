<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('productos.editar');
require_login();

$d = json_decode(file_get_contents('php://input'), true) ?? [];
$id = (int)($d['id'] ?? 0);
if ($id<=0) json_err('id requerido', 400);

$campos = [];
$args = [];

foreach (['sku'=>'SKU','nombre'=>'Nombre','precio'=>'Precio','categoriaId'=>'CategoriaId','proveedorId'=>'ProveedorId','estado'=>'Estado'] as $k=>$col) {
  if (array_key_exists($k, $d)) { $campos[] = "$col = ?"; $args[] = $d[$k]; }
}
if (!$campos) json_err('nada para actualizar', 400);

$args[] = $id;
$sql = "UPDATE dbo.Producto SET ".implode(',', $campos)." WHERE Id = ?";
$stm = pdo()->prepare($sql);
$stm->execute($args);

json_ok(['msg'=>'Producto actualizado']);
