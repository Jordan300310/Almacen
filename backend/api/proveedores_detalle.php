<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('proveedores.ver');
require_login();

$id = (int)($_GET['id'] ?? 0);
if ($id<=0) json_err('id requerido', 400);

$st = pdo()->prepare("SELECT TOP 1 Id, Nombre, Telefono, Email, Direccion, Estado
                      FROM dbo.Proveedor WHERE Id=?");
$st->execute([$id]);
$row = $st->fetch();
if (!$row) json_err('no encontrado', 404);

json_ok(['item'=>$row]);