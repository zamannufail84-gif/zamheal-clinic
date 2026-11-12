<?php
declare(strict_types=1);

// Pembatas percobaan login (berbasis file sementara; per IP + username).
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW = 900; // 15 menit

function rl_file(string $key): string {
    return sys_get_temp_dir() . '/zamheal_rl_' . hash('sha256', $key);
}
function rl_blocked(string $key): bool {
    $f = rl_file($key);
    if (!is_file($f)) return false;
    $d = json_decode((string) @file_get_contents($f), true);
    if (!is_array($d) || ($d['reset'] ?? 0) < time()) { @unlink($f); return false; }
    return ($d['count'] ?? 0) >= LOGIN_MAX_ATTEMPTS;
}
function rl_fail(string $key): void {
    $f = rl_file($key);
    $d = is_file($f) ? json_decode((string) @file_get_contents($f), true) : null;
    if (!is_array($d) || ($d['reset'] ?? 0) < time()) $d = ['count' => 0, 'reset' => time() + LOGIN_WINDOW];
    $d['count']++;
    @file_put_contents($f, json_encode($d), LOCK_EX);
}
function rl_clear(string $key): void { @unlink(rl_file($key)); }

function route_login(): void {
    $b = body();
    $username = str($b['username'] ?? '', 100);
    $password = is_string($b['password'] ?? null) ? $b['password'] : '';
    if ($username === '' || $password === '') fail('Username/email dan password wajib diisi.');

    $key = ($_SERVER['REMOTE_ADDR'] ?? 'local') . '|' . mb_strtolower($username);
    if (rl_blocked($key)) fail('Terlalu banyak percobaan. Coba lagi dalam 15 menit.', 429);

    $user = q1('SELECT id, username, password_hash, role FROM users WHERE username = ? OR email = ? LIMIT 1', [$username, $username]);
    // Pesan sengaja sama untuk "user tidak ada" dan "password salah".
    if (!$user || !password_verify($password, $user['password_hash'])) {
        rl_fail($key);
        fail('Username atau password salah.', 401);
    }
    rl_clear($key);

    session_boot();
    session_regenerate_id(true);
    $_SESSION = ['uid' => (int)$user['id'], 'username' => $user['username'], 'role' => $user['role'], 'exp' => time() + 28800];

    try {
        run('INSERT INTO login_history (user_id, ip_address, user_agent) VALUES (?,?,?)', [
            $user['id'], substr($_SERVER['REMOTE_ADDR'] ?? '', 0, 45), substr($_SERVER['HTTP_USER_AGENT'] ?? 'unknown', 0, 500),
        ]);
    } catch (Throwable $e) { /* riwayat login tidak boleh menggagalkan login */ }

    json_out(['role' => $user['role']]);
}

function route_register(): void {
    $b = body();
    $name = str($b['name'] ?? '', 100);
    $email = mb_strtolower(str($b['email'] ?? '', 100));
    $phone = str($b['phone'] ?? '', 20);
    $address = str($b['address'] ?? '', 500);
    $password = is_string($b['password'] ?? null) ? $b['password'] : '';

    if ($name === '' || $email === '' || $password === '') fail('Mohon isi semua field yang wajib.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Format email tidak valid.');
    if (mb_strlen($password) < 6) fail('Password minimal 6 karakter.');
    if (q1('SELECT id FROM users WHERE email = ?', [$email])) fail('Email sudah terdaftar.', 409);

    $base = substr(preg_replace('/[^a-z0-9]/', '', mb_strtolower($name)) ?? '', 0, 30) ?: 'pasien';
    $username = $base . random_int(100, 999);

    $pdo = db();
    $pdo->beginTransaction();
    try {
        run("INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?, 'patient')",
            [$username, $email, password_hash($password, PASSWORD_DEFAULT)]);
        $uid = (int) $pdo->lastInsertId();
        run('INSERT INTO patients (user_id, name, email, phone, address) VALUES (?,?,?,?,?)',
            [$uid, $name, $email, $phone ?: null, $address ?: null]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
    json_out(['username' => $username], 201);
}

function route_logout(): void {
    session_boot();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => $p['path'], 'secure' => $p['secure'],
            'httponly' => true, 'samesite' => 'Lax']);
    }
    session_destroy();
    json_out(['ok' => true]);
}

function route_me(): void {
    $u = current_user() ?? fail('Belum login.', 401);
    json_out(['username' => $u['username'], 'role' => $u['role']]);
}
