<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';

require_login();

$pdo = pdo();

// filtro opcional ?q=texto
$q = trim($_GET['q'] ?? '');
if ($q !== '') {
  $stmt = $pdo->prepare(
    "SELECT Id, Nombre
     FROM dbo.Categoria
     WHERE Estado = 1 AND Nombre LIKE ?
     ORDER BY Nombre"
  );
  $stmt->execute([$q.'%']);
  $rows = $stmt->fetchAll();
} else {
  $rows = $pdo->query(
    "SELECT Id, Nombre
     FROM dbo.Categoria
     WHERE Estado = 1
     ORDER BY Nombre"
  )->fetchAll();
}

json_ok(['items' => $rows]);
