<?php
function pdo(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;

  // AJUSTA estos valores a tu entorno:
  $server   = "JORDAN\\SQLEXPRESS01";
  $database = "Arq";
  $user     = "sa";
  $password = "12345678";

  $dsn = "sqlsrv:Server=$server;Database=$database;Encrypt=yes;TrustServerCertificate=yes";
  $pdo = new PDO($dsn, $user, $password, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}
