<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_login();

$rows = pdo()->query("SELECT Id, Nombre FROM dbo.Cargo WHERE Estado=1 ORDER BY Nombre")->fetchAll();
json_ok(['items'=>$rows]);
