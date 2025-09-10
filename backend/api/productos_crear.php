<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('productos.crear');
require_login();

$d = json_decode(file_get_contents('php://input'), true) ?? [];
$sku   = trim($d['sku'] ?? '');
$nombre= trim($d['nombre'] ?? '');
$precio= isset($d['precio']) ? (float)$d['precio'] : -1;
$categoriaId = (int)($d['categoriaId'] ?? 0);
$proveedorId = isset($d['proveedorId']) && $d['proveedorId'] !== '' ? (int)$d['proveedorId'] : null;

if ($sku==='' || $nombre==='' || $precio<0 || $categoriaId<=0) {
  json_err('sku, nombre, precio>=0 y categoriaId requeridos', 400);
}

$pdo = pdo();
$pdo->beginTransaction();
try {
  $ins = $pdo->prepare("INSERT INTO dbo.Producto (SKU,Nombre,Precio,CategoriaId,ProveedorId) VALUES (?,?,?,?,?)");
  $ins->execute([$sku,$nombre,$precio,$categoriaId,$proveedorId]);
  $id = (int)$pdo->query("SELECT SCOPE_IDENTITY() AS Id")->fetch()['Id'];
  $pdo->commit();
  json_ok(['id'=>$id, 'msg'=>'Producto creado']);
} catch(Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  json_err('No se pudo crear', 400, ['detalle'=>$e->getMessage()]);
}
