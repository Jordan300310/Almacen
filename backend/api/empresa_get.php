<?php
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';

require_login(); // cualquiera logueado puede leer

json_ok([
  'empresa' => [
    'nombre'    => 'Casa Concepto Muebles Perú',
    'ruc'       => '20123456789',
    'direccion' => 'Av. Siempre Viva 123 - Lima',
    'telefono'  => '(01) 555-1234',
    'email'     => 'ventas@gmail.com'
  ]
]);
