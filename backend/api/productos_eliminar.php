<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('productos.eliminar');
require_login();

$id = (int)($_POST['id'] ?? ($_GET['id'] ?? 0));
if ($id<=0) json_err('id requerido', 400);

/* Opcional: impedir desactivar si hay stock > 0 */
$st = pdo()->prepare("SELECT Stock FROM dbo.Inventario WHERE ProductoId=?");
$st->execute([$id]);
$stock = (int)($st->fetch()['Stock'] ?? 0);
if ($stock > 0) json_err('No se puede desactivar: stock > 0', 400);

$upd = pdo()->prepare("UPDATE dbo.Producto SET Estado=0 WHERE Id=?");
$upd->execute([$id]);

json_ok(['msg'=>'Producto desactivado']);
