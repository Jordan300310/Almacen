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
  $proveedorId = ($proveedorId === '' || $proveedorId === null) ? null : (int)$proveedorId;

  $sql = "INSERT INTO dbo.Producto
            (SKU, Nombre, Precio, Estado, CategoriaId, ProveedorId)
          OUTPUT INSERTED.Id
          VALUES (?,?,?,?,?,?)";
  $st = $pdo->prepare($sql);
  $st->execute([$sku, $nombre, $precio, 1, $categoriaId, $proveedorId]);
  $id = (int)$st->fetchColumn();
  if ($id <= 0) throw new Exception('No se obtuvo Id de producto');

  // 2) Crea Inventario para ese producto
  $st2 = $pdo->prepare(
    "INSERT INTO dbo.Inventario (ProductoId, Stock, MinStock) VALUES (?,?,?)"
  );
  $st2->execute([$id, 0, 0]);

  $pdo->commit();
  json_ok(['id' => $id, 'msg' => 'Producto creado']);
} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  json_err('No se pudo crear', 400, ['detalle' => $e->getMessage()]);
}
