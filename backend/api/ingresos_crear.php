<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('ingresos.crear');
$user = require_login();

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$productoId = (int)($data['productoId'] ?? 0);
$cantidad   = (int)($data['cantidad'] ?? 0);
$motivo     = trim($data['motivo'] ?? 'Ingreso desde web');
$referencia = trim($data['referencia'] ?? 'WEB');

if ($productoId <= 0 || $cantidad <= 0) {
  json_err('productoId y cantidad > 0 son requeridos', 400);
}

/* Validación: producto existe y activo, con inventario */
$chk = pdo()->prepare("
  SELECT TOP 1 p.Id
  FROM dbo.Producto p
  JOIN dbo.Inventario i ON i.ProductoId = p.Id
  WHERE p.Id = ? AND p.Estado = 1
");
$chk->execute([$productoId]);
if (!$chk->fetch()) {
  json_err('Producto inexistente o inactivo', 400);
}

/* Ejecuta ingreso */
$stmt = pdo()->prepare("EXEC dbo.SP_IngresoAlmacen @ProductoId=?, @EmpleadoId=?, @Cantidad=?, @Motivo=?, @Referencia=?");
$stmt->execute([$productoId, $user['id'], $cantidad, $motivo, $referencia]);

json_ok(['msg' => 'Ingreso registrado']);
