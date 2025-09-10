<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('empleados.ver');
require_login();

$id = (int)($_GET['id'] ?? 0);
if ($id<=0) json_err('id requerido', 400);

$sql = "SELECT TOP 1 e.Id, e.Nombre, e.Username, e.Estado, e.CargoId, c.Nombre AS CargoNombre
        FROM dbo.Empleado e
        LEFT JOIN dbo.Cargo c ON c.Id = e.CargoId
        WHERE e.Id = ?";
$st = pdo()->prepare($sql);
$st->execute([$id]);
$row = $st->fetch();
if (!$row) json_err('no encontrado', 404);

json_ok(['item'=>$row]);
