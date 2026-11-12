<?php
declare(strict_types=1);

function route_receptionist_overview(): void {
    receptionist_of(guard('receptionist'));

    $stats = q1("SELECT
        (SELECT COUNT(*) FROM appointments WHERE status = 'scheduled') AS waiting,
        (SELECT COUNT(*) FROM payments WHERE payment_status = 'pending') AS pending_payments,
        (SELECT COUNT(*) FROM patients) AS total_patients,
        (SELECT COUNT(*) FROM appointments WHERE appointment_date = CURDATE() AND status <> 'cancelled') AS today_appointments");

    $payments = q("SELECT pay.id, pay.amount, pay.payment_method AS method, pay.payment_status AS status,
            pay.payment_proof AS proof, p.name AS patient_name
        FROM payments pay JOIN patients p ON p.id = pay.patient_id
        ORDER BY FIELD(pay.payment_status,'pending','failed','verified'), pay.id DESC");
    foreach ($payments as &$pay) $pay['amount'] = (float) $pay['amount'];
    unset($pay);

    json_out([
        'stats' => $stats,
        'appointments' => q("SELECT a.id, a.appointment_date AS date, LEFT(a.appointment_time, 5) AS time, a.status,
                p.name AS patient_name, d.name AS doctor_name
            FROM appointments a JOIN patients p ON p.id = a.patient_id JOIN doctors d ON d.id = a.doctor_id
            WHERE a.status IN ('scheduled','confirmed')
            ORDER BY a.appointment_date, a.appointment_time"),
        'payments' => $payments,
        'patients' => q('SELECT id, name, phone, email, address FROM patients ORDER BY name'),
    ]);
}

function route_receptionist_appointment_confirm(int $id): void {
    guard('receptionist');
    run("UPDATE appointments SET status = 'confirmed' WHERE id = ? AND status = 'scheduled'", [$id])
        ? json_out(['ok' => true]) : fail('Jadwal tidak ditemukan atau sudah dikonfirmasi.', 404);
}

function route_receptionist_payment_decide(int $id): void {
    $rec = receptionist_of(guard('receptionist'));
    $action = str(body()['action'] ?? '', 10);
    if (!in_array($action, ['verify', 'reject'], true)) fail('Aksi tidak valid.');
    $status = $action === 'verify' ? 'verified' : 'failed';
    run("UPDATE payments SET payment_status = ?, verified_by = ?, payment_date = NOW() WHERE id = ? AND payment_status = 'pending'",
        [$status, $rec['id'], $id])
        ? json_out(['ok' => true]) : fail('Pembayaran tidak ditemukan atau sudah diproses.', 404);
}

function route_receptionist_patient_create(): void {
    guard('receptionist', 'admin');
    $b = body();
    $name = str($b['name'] ?? '', 100);
    $phone = str($b['phone'] ?? '', 20);
    $email = mb_strtolower(str($b['email'] ?? '', 100));
    $address = str($b['address'] ?? '', 500);
    if ($name === '' || $phone === '') fail('Nama dan telepon wajib diisi.');
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Format email tidak valid.');
    run('INSERT INTO patients (name, email, phone, address) VALUES (?,?,?,?)', [$name, $email ?: null, $phone, $address ?: null]);
    json_out(['id' => (int) db()->lastInsertId()], 201);
}
