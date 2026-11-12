<?php
declare(strict_types=1);

/**
 * Front controller API Zamheal.
 * Alamat: /api/index.php/<rute>   contoh: /api/index.php/auth/login
 * (Next.js memetakan /api/<rute> ke sini lewat rewrites, jadi mod_rewrite tidak diperlukan.)
 */
require __DIR__ . '/../src/bootstrap.php';
foreach (['auth', 'admin', 'doctor', 'patient', 'receptionist'] as $f) require __DIR__ . "/../src/routes/$f.php";

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') { http_response_code(204); exit; }

$path = $_SERVER['PATH_INFO'] ?? '';
if ($path === '' && isset($_SERVER['REQUEST_URI'])) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '';
    $pos = strpos($uri, 'index.php');
    $path = $pos !== false ? substr($uri, $pos + strlen('index.php')) : '';
}
$path = '/' . trim($path, '/');

// Permintaan tulis wajib JSON (membantu menangkal CSRF form lintas situs).
if (in_array($method, ['POST', 'PATCH', 'PUT'], true) && ($_SERVER['CONTENT_LENGTH'] ?? '0') !== '0') {
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) fail('Content-Type harus application/json.', 415);
}

$routes = [
    ['POST',   '#^/auth/login$#',                     'route_login'],
    ['POST',   '#^/auth/register$#',                  'route_register'],
    ['POST',   '#^/auth/logout$#',                    'route_logout'],
    ['GET',    '#^/auth/me$#',                        'route_me'],

    ['GET',    '#^/admin$#',                          'route_admin_overview'],
    ['POST',   '#^/admin/doctors$#',                  'route_admin_doctor_create'],
    ['DELETE', '#^/admin/doctors/(\d+)$#',            'route_admin_doctor_deactivate'],
    ['POST',   '#^/admin/appointments$#',             'route_admin_appointment_create'],
    ['DELETE', '#^/admin/appointments/(\d+)$#',       'route_admin_appointment_cancel'],

    ['GET',    '#^/doctor$#',                         'route_doctor_overview'],
    ['PATCH',  '#^/doctor/appointments/(\d+)$#',      'route_doctor_appointment_update'],
    ['POST',   '#^/doctor/attendance$#',              'route_doctor_attendance'],

    ['GET',    '#^/patient$#',                        'route_patient_overview'],
    ['POST',   '#^/patient/appointments$#',           'route_patient_appointment_create'],
    ['POST',   '#^/patient/payments$#',               'route_patient_payment_create'],

    ['GET',    '#^/receptionist$#',                   'route_receptionist_overview'],
    ['PATCH',  '#^/receptionist/appointments/(\d+)$#','route_receptionist_appointment_confirm'],
    ['PATCH',  '#^/receptionist/payments/(\d+)$#',    'route_receptionist_payment_decide'],
    ['POST',   '#^/receptionist/patients$#',          'route_receptionist_patient_create'],
];

$pathMatched = false;
foreach ($routes as [$m, $pattern, $handler]) {
    if (!preg_match($pattern, $path, $mt)) continue;
    $pathMatched = true;
    if ($m !== $method) continue;
    $handler(...array_map('intval', array_slice($mt, 1)));
    exit;
}
fail($pathMatched ? 'Metode tidak diizinkan.' : 'Endpoint tidak ditemukan.', $pathMatched ? 405 : 404);
