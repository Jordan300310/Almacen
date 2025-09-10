<?php
require_once __DIR__ . '/../lib/json.php';
require_once __DIR__ . '/../lib/auth.php';
require_login();

start_session();
json_ok([
  'user'  => $_SESSION['user'],
  'perms' => $_SESSION['perms'] ?? []
]);