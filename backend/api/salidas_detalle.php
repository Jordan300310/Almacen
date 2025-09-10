<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';

require_perm('movimientos.ver');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) json_err('id requerido', 400);

$pdo = pdo();

$h = $pdo->prepare("
  SELECT
    sc.Id, sc.Numero, sc.FechaUtc, sc.Observaciones,
    cli.Id AS ClienteId, cli.Nombre AS ClienteNombre, cli.Documento AS ClienteDocumento, cli.Direccion AS ClienteDireccion,
    emp.Id AS EmpleadoId, emp.Nombre AS EmpleadoNombre
  FROM dbo.SalidaCabecera sc
  LEFT JOIN dbo.Cliente  cli ON cli.Id  = sc.ClienteId
  LEFT JOIN dbo.Empleado emp ON emp.Id = sc.EmpleadoId
  WHERE sc.Id = ?
");
$h->execute([$id]);
$head = $h->fetch();
if (!$head) json_err('Salida no encontrada', 404);

$d = $pdo->prepare("
  SELECT
    sd.ProductoId, p.SKU, p.Nombre AS Producto,
    sd.Cantidad, sd.PrecioUnitario, sd.StockDespues
  FROM dbo.SalidaDetalle sd
  JOIN dbo.Producto p ON p.Id = sd.ProductoId
  WHERE sd.SalidaId = ?
  ORDER BY sd.Id
");
$d->execute([$id]);
$items = $d->fetchAll();

json_ok(['header' => $head, 'items' => $items]);
