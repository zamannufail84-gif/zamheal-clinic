<?php
declare(strict_types=1);

// ---------- Konfigurasi (.env + variabel lingkungan) ----------
function env_load(string $file): array {
    $out = [];
    if (!is_readable($file)) return $out;
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $out[trim($k)] = trim($v);
    }
    return $out;
}

function config(string $key, ?string $default = null): ?string {
    static $file = null;
    $file ??= env_load(__DIR__ . '/../.env');
    $v = getenv($key);
    if ($v !== false && $v !== '') return $v;
    return $file[$key] ?? $default;
}

date_default_timezone_set(config('APP_TIMEZONE', 'Asia/Jakarta'));
ini_set('display_errors', '0');
error_reporting(E_ALL);

// ---------- Respons JSON ----------
function json_out(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
    exit;
}

function fail(string $message, int $status = 400): never {
    json_out(['error' => $message], $status);
}

set_exception_handler(function (Throwable $e) {
    error_log('[zamheal] ' . $e::class . ': ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    $dbDown = $e instanceof PDOException && in_array((string)$e->getCode(), ['2002', '1045', '1049', '2006'], true);
    fail($dbDown ? 'Server tidak dapat terhubung ke database. Pastikan MySQL menyala dan pengaturan .env benar.'
                 : 'Terjadi kesalahan pada server.', 500);
});

// ---------- Database ----------
function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        config('DB_HOST', '127.0.0.1'), config('DB_PORT', '3306'), config('DB_NAME', 'zamheal_clinic'));
    $pdo = new PDO($dsn, config('DB_USER', 'root'), config('DB_PASSWORD', ''), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function q(string $sql, array $params = []): array {
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st->fetchAll();
}

function q1(string $sql, array $params = []): ?array {
    return q($sql, $params)[0] ?? null;
}

function run(string $sql, array $params = []): int {
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st->rowCount();
}

function db_today(): string {
    return (string) db()->query('SELECT CURDATE()')->fetchColumn();
}

// ---------- Request ----------
function body(): array {
    static $cache = null;
    if ($cache !== null) return $cache;
    $raw = file_get_contents('php://input') ?: '';
    $data = $raw === '' ? [] : json_decode($raw, true);
    if (!is_array($data)) fail('Format permintaan tidak valid (harus JSON).', 400);
    return $cache = $data;
}

function str(mixed $v, int $max = 255): string {
    return is_string($v) ? mb_substr(trim($v), 0, $max) : '';
}

function is_date(string $v): bool {
    return (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) && strtotime($v) !== false;
}

function is_time(string $v): bool {
    return (bool) preg_match('/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/', $v);
}

function to_time(string $v): string {
    return strlen($v) === 5 ? $v . ':00' : $v;
}

// ---------- Sesi & hak akses ----------
function session_boot(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    session_name('zamheal_sid');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    ini_set('session.gc_maxlifetime', '28800');
    session_start();
}

function current_user(): ?array {
    session_boot();
    if (empty($_SESSION['uid']) || (($_SESSION['exp'] ?? 0) < time())) return null;
    return ['uid' => (int)$_SESSION['uid'], 'username' => (string)$_SESSION['username'], 'role' => (string)$_SESSION['role']];
}

/** Wajib login (dan berperan sesuai bila $roles diisi). Mengembalikan data pengguna. */
function guard(string ...$roles): array {
    $u = current_user();
    if (!$u) fail('Silakan login terlebih dahulu.', 401);
    if ($roles && !in_array($u['role'], $roles, true)) fail('Anda tidak memiliki akses.', 403);
    return $u;
}

// ---------- Entitas bersama ----------
function consultation_fee(): int {
    return (int) config('CONSULTATION_FEE', '150000');
}

function doctor_of(array $u): array {
    return q1('SELECT * FROM doctors WHERE user_id = ? AND is_active = 1', [$u['uid']])
        ?? fail('Akun dokter belum terhubung ke data dokter.', 404);
}

function patient_of(array $u): array {
    return q1('SELECT * FROM patients WHERE user_id = ?', [$u['uid']])
        ?? fail('Akun pasien belum terhubung ke data pasien.', 404);
}

function receptionist_of(array $u): array {
    return q1('SELECT * FROM receptionists WHERE user_id = ?', [$u['uid']])
        ?? fail('Akun resepsionis belum terhubung ke data resepsionis.', 404);
}

/** Validasi + buat jadwal konsultasi baru (dipakai admin dan pasien). */
function create_appointment(mixed $doctorId, int $patientId, string $date, string $time): int {
    $doctorId = (int) $doctorId;
    if ($doctorId <= 0) fail('Pilih dokter terlebih dahulu.');
    if (!is_date($date)) fail('Tanggal tidak valid.');
    if (!is_time($time)) fail('Waktu tidak valid.');
    if ($date < db_today()) fail('Tanggal tidak boleh di masa lalu.');
    if (!q1('SELECT id FROM doctors WHERE id = ? AND is_active = 1', [$doctorId])) fail('Dokter tidak ditemukan.', 404);

    $time = to_time($time);
    if (q1("SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status <> 'cancelled' LIMIT 1",
        [$doctorId, $date, $time])) {
        fail('Dokter sudah memiliki jadwal pada jam tersebut.', 409);
    }
    run("INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status) VALUES (?,?,?,?, 'scheduled')",
        [$patientId, $doctorId, $date, $time]);
    return (int) db()->lastInsertId();
}
