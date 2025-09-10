<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('productos.ver');
require_login();

$sql = "
SELECT
  p.Id, p.SKU, p.Nombre, p.Precio, p.Estado,
  c.Nombre  AS Categoria,
  pr.Nombre AS Proveedor
FROM dbo.Producto p
JOIN dbo.Categoria c   ON c.Id = p.CategoriaId
LEFT JOIN dbo.Proveedor pr ON pr.Id = p.ProveedorId
WHERE p.Estado = 1                 -- <-- solo activos
ORDER BY p.Nombre";
$items = pdo()->query($sql)->fetchAll();

json_ok(['items'=>$items]);