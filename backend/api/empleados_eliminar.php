<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('empleados.eliminar');
require_login();

$id = (int)($_GET['id'] ?? ($_POST['id'] ?? 0));
if ($id<=0) json_err('id requerido', 400);

$st = pdo()->prepare("UPDATE dbo.Empleado SET Estado=0 WHERE Id=?");
$st->execute([$id]);

json_ok(['msg'=>'Empleado desactivado']);
