<?php
// backend/api/productos_detalle.php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('productos.ver');
require_login();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
  json_err('id requerido', 400);
}

$sql = "SELECT TOP 1
          p.Id, p.SKU, p.Nombre, p.Precio, p.Estado,
          p.CategoriaId, p.ProveedorId,
          c.Nombre  AS CategoriaNombre,
          pr.Nombre AS ProveedorNombre
        FROM dbo.Producto p
        JOIN dbo.Categoria c   ON c.Id  = p.CategoriaId
        LEFT JOIN dbo.Proveedor pr ON pr.Id = p.ProveedorId
        WHERE p.Id = ?";
$st = pdo()->prepare($sql);
$st->execute([$id]);
$row = $st->fetch();

if (!$row) {
  // sigue siendo JSON aunque el HTTP sea 404
  json_err('no encontrado', 404);
}

json_ok(['item' => $row]);
