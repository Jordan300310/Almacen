<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_login();

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$productoId = (int)($data['productoId'] ?? 0);
$minStock   = isset($data['minStock']) ? (int)$data['minStock'] : null;

if ($productoId <= 0 || $minStock === null || $minStock < 0) {
  json_err('productoId y minStock>=0 requeridos', 400);
}

$stm = pdo()->prepare("UPDATE dbo.Inventario SET MinStock=? WHERE ProductoId=?");
$stm->execute([$minStock, $productoId]);

json_ok(['msg'=>'MinStock actualizado']);
