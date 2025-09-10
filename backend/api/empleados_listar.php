<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('empleados.ver');
require_login();

$sql = "
SELECT e.Id, e.Nombre, e.Username, e.Estado, c.Nombre AS Cargo
FROM dbo.Empleado e
LEFT JOIN dbo.Cargo c ON c.Id = e.CargoId
WHERE e.Estado = 1                 -- <-- solo activos
ORDER BY e.Nombre";
$items = pdo()->query($sql)->fetchAll();

json_ok(['items'=>$items]);
