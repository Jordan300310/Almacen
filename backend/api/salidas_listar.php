<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';

require_perm('movimientos.ver');

$pdo = pdo();
$sql = "
  SELECT TOP 200
    sc.Id,
    sc.Numero,
    sc.FechaUtc,
    sc.Observaciones,
    cli.Nombre AS Cliente,
    COUNT(sd.Id) AS Items
  FROM dbo.SalidaCabecera sc
  LEFT JOIN dbo.Cliente cli ON cli.Id = sc.ClienteId
  LEFT JOIN dbo.SalidaDetalle sd ON sd.SalidaId = sc.Id
  GROUP BY sc.Id, sc.Numero, sc.FechaUtc, sc.Observaciones, cli.Nombre
  ORDER BY sc.Id DESC
";
$items = $pdo->query($sql)->fetchAll();
json_ok(['items' => $items]);
