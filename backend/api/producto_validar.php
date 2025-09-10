<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_login();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) json_err('id requerido', 400);

$stmt = pdo()->prepare("
  SELECT p.Id, p.SKU, p.Nombre, p.Precio, p.Estado, i.Stock
  FROM dbo.Producto p
  JOIN dbo.Inventario i ON i.ProductoId = p.Id
  WHERE p.Id = ?
");
$stmt->execute([$id]);
$row = $stmt->fetch();

if (!$row || (int)$row['Estado'] !== 1) {
  json_err('Producto inexistente o inactivo', 404);
}

json_ok(['producto' => $row]);
