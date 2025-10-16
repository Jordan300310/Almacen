<?php
// backend/api/primer_uso.php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = pdo();
$cnt = (int)$pdo->query("SELECT COUNT(*) FROM dbo.Empleado")->fetchColumn();

if ($cnt === 0) {
  // Asegura que exista el cargo ADMIN y devuelve su Id
  $pdo->exec("
    IF NOT EXISTS (SELECT 1 FROM dbo.Cargo WHERE Nombre = N'ADMIN')
      INSERT INTO dbo.Cargo (Nombre, Descripcion) VALUES (N'ADMIN', N'Acceso total')
  ");
  $cargoId = (int)$pdo->query("SELECT Id FROM dbo.Cargo WHERE Nombre = N'ADMIN'")->fetchColumn();
  json_ok(['zero' => true, 'cargoAdminId' => $cargoId]);
}

json_ok(['zero' => false]);
