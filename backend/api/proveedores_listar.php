<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('proveedores.ver');
require_login();

$sql = "
SELECT Id, Nombre, Telefono, Email, Direccion, Estado
FROM dbo.Proveedor
WHERE Estado = 1                   -- <-- solo activos
ORDER BY Nombre";
$items = pdo()->query($sql)->fetchAll();

json_ok(['items'=>$items]);
