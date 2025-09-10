<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_perm('movimientos.ver');
require_login();

$limit = isset($_GET['limit']) ? max(1, min(200, (int)$_GET['limit'])) : 100;
$sql = "SELECT TOP $limit *
        FROM dbo.V_Movimientos
        ORDER BY FechaUtc DESC, Id DESC";
$items = pdo()->query($sql)->fetchAll();
json_ok(['items' => $items]);
