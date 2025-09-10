<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('inventario.ver');
require_login();

$items = pdo()->query("SELECT * FROM dbo.V_Inventario ORDER BY ProductoId")->fetchAll();
json_ok(['items' => $items]);
