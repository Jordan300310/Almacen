<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';

require_login();

$pdo = pdo();
$sql = "SELECT Id, ISNULL(Documento,'') AS Documento, Nombre, Estado
        FROM dbo.Cliente
        WHERE Estado = 1
        ORDER BY Nombre";
$items = $pdo->query($sql)->fetchAll();
json_ok(['items' => $items]);
