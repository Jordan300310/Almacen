<?php
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';

require_login(); // cualquiera logueado puede leer

json_ok([
  'empresa' => [
    'nombre'    => 'ARQ Almacén',
    'ruc'       => '20123456789',
    'direccion' => 'Av. Siempre Viva 123 - Lima',
    'telefono'  => '(01) 555-1234',
    'email'     => 'ventas@arqalmacen.com'
  ]
]);
