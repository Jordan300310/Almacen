<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';

require_perm('salidas.crear');
$user = require_login();

try {
  $data = json_decode(file_get_contents('php://input'), true) ?? [];
  $clienteId     = (int)($data['clienteId'] ?? 0);
  $observaciones = trim($data['observaciones'] ?? '');
  $motivo        = trim($data['motivo'] ?? 'Salida (web)');
  $items         = $data['items'] ?? [];

  if ($clienteId <= 0) {
    json_err('clienteId requerido', 400);
  }
  if (!is_array($items) || count($items) === 0) {
    json_err('Debe enviar al menos un item', 400);
  }

  $pdo = pdo();

  // Verificar cliente activo
  $stCli = $pdo->prepare("SELECT TOP 1 Id FROM dbo.Cliente WHERE Id=? AND Estado=1");
  $stCli->execute([$clienteId]);
  if (!$stCli->fetchColumn()) {
    json_err('Cliente inválido o inactivo', 400);
  }

  $pdo->beginTransaction();

  // Cabecera CON cliente requerido
  $cab = $pdo->prepare("
    INSERT INTO dbo.SalidaCabecera (EmpleadoId, Observaciones, ClienteId)
    OUTPUT INSERTED.Id
    VALUES (?, ?, ?)
  ");
  $cab->execute([$user['id'], $observaciones, $clienteId]);
  $cabId = (int)$cab->fetchColumn();
  if ($cabId <= 0) throw new Exception('No se obtuvo Id de cabecera');

  // Numero de salida
  $numStmt = $pdo->prepare("SELECT Numero FROM dbo.SalidaCabecera WHERE Id = ?");
  $numStmt->execute([$cabId]);
  $numero = $numStmt->fetchColumn();

  // Preparados
  $qProd   = $pdo->prepare("
    SELECT p.Id, p.Precio, i.Stock
    FROM dbo.Producto p
    JOIN dbo.Inventario i ON i.ProductoId = p.Id
    WHERE p.Id = ? AND p.Estado = 1
  ");
  $callSal = $pdo->prepare("EXEC dbo.SP_SalidaAlmacen @ProductoId=?, @EmpleadoId=?, @Cantidad=?, @Motivo=?, @Referencia=?");
  $insDet  = $pdo->prepare("
    INSERT INTO dbo.SalidaDetalle (SalidaId, ProductoId, Cantidad, PrecioUnitario, StockDespues, Observaciones)
    VALUES (?, ?, ?, ?, ?, ?)
  ");
  $qStock  = $pdo->prepare("SELECT Stock FROM dbo.Inventario WHERE ProductoId = ?");

  foreach ($items as $it) {
    $prodId = (int)($it['productoId'] ?? 0);
    $cant   = (int)($it['cantidad'] ?? 0);
    $puIn   = $it['precioUnitario'] ?? null;
    $obsDet = trim($it['observaciones'] ?? '');

    if ($prodId <= 0 || $cant <= 0) throw new Exception('Producto y cantidad > 0 requeridos');

    $qProd->execute([$prodId]);
    $prod = $qProd->fetch();
    if (!$prod) throw new Exception("Producto $prodId inexistente o inactivo");

    $stockActual = (int)$prod['Stock'];
    if ($stockActual < $cant) throw new Exception("Stock insuficiente para producto $prodId (disp: $stockActual)");

    $pu = ($puIn === null || $puIn === '' || (float)$puIn <= 0) ? (float)$prod['Precio'] : (float)$puIn;

    // Motivo se registra en Movimiento
    $callSal->execute([$prodId, $user['id'], $cant, $motivo, (string)$cabId]);

    $qStock->execute([$prodId]);
    $stockDesp = (int)$qStock->fetchColumn();

    $insDet->execute([$cabId, $prodId, $cant, $pu, $stockDesp, $obsDet]);
  }

  $pdo->commit();
  json_ok(['msg'=>'Salida registrada','salidaId'=>$cabId,'numero'=>$numero]);

} catch (Throwable $e) {
  if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
  json_err('No se pudo registrar la salida', 400, ['detalle' => $e->getMessage()]);
}
