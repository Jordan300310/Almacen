<?php
function json_headers() {
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  header('X-Content-Type-Options: nosniff');
}
function body_json() {
  $raw = file_get_contents('php://input');
  return $raw ? json_decode($raw, true) : [];
}
function json_ok($data = [], $code = 200) {
  http_response_code($code); json_headers();
  echo json_encode(['ok'=>true,'data'=>$data], JSON_UNESCAPED_UNICODE);
  exit;
}
function json_err($msg, $code = 400, $extra = []) {
  http_response_code($code); json_headers();
  echo json_encode(['ok'=>false,'error'=>$msg,'extra'=>$extra], JSON_UNESCAPED_UNICODE);
  exit;
}
