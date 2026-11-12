<?php
declare(strict_types=1);

function route_admin_overview(): void {
    guard('admin');

    $stats = q1("SELECT
        (SELECT COUNT(*) FROM doctors WHERE is_active = 1) AS total_doctors,
        (SELECT COUNT(*) FROM patients) AS total_patients,
        (SELECT COUNT(*) FROM appointments WHERE appointment_date = CURDATE() AND status <> 'cancelled') AS today_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'completed') AS completed_appointments");

    $appointments = q("SELECT a.id, a.appointment_date AS date, LEFT(a.appointment_time, 5) AS time, a.status, a.created_at,
            p.name AS patient_name, d.name AS doctor_name
        FROM appointments a
        JOIN patients p ON p.id = a.patient_id
        JOIN doctors d ON d.id = a.doctor_id
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
        LIMIT 200");

    $recent = $appointments;
    usort($recent, fn($x, $y) => strcmp((string)$y['created_at'], (string)$x['created_at']) ?: ($y['id'] <=> $x['id']));
    $recent = array_slice($recent, 0, 10);

    json_out([
        'stats' => $stats,
        'appointments' => $appointments,
        'recent' => $recent,
        'doctors' => q('SELECT id, name, specialty, phone FROM doctors WHERE is_active = 1 ORDER BY name'),
        'patients' => q('SELECT id, name FROM patients ORDER BY name'),
        'attendance' => q("SELECT da.id, da.attendance_date AS date, LEFT(da.check_in_time, 5) AS check_in,
                LEFT(da.check_out_time, 5) AS check_out, da.status, d.name AS doctor_name
            FROM doctor_attendance da JOIN doctors d ON d.id = da.doctor_id
            ORDER BY da.attendance_date DESC, d.name LIMIT 60"),
    ]);
}

function route_admin_doctor_create(): void {
    guard('admin');
    $b = body();
    $name = str($b['name'] ?? '', 100);
    $specialty = str($b['specialty'] ?? '', 100);
    $phone = str($b['phone'] ?? '', 20);
    if ($name === '' || $specialty === '') fail('Nama dan spesialisasi wajib diisi.');
    run('INSERT INTO doctors (name, specialty, phone) VALUES (?,?,?)', [$name, $specialty, $phone ?: null]);
    json_out(['id' => (int) db()->lastInsertId()], 201);
}

// Dokter dinonaktifkan (bukan dihapus) agar riwayat jadwal & rekam medis tetap utuh.
function route_admin_doctor_deactivate(int $id): void {
    guard('admin');
    run('UPDATE doctors SET is_active = 0 WHERE id = ? AND is_active = 1', [$id])
        ? json_out(['ok' => true]) : fail('Dokter tidak ditemukan.', 404);
}

function route_admin_appointment_create(): void {
    guard('admin');
    $b = body();
    $patientId = (int) ($b['patientId'] ?? 0);
    if ($patientId <= 0 || !q1('SELECT id FROM patients WHERE id = ?', [$patientId])) fail('Pilih pasien terlebih dahulu.');
    $id = create_appointment($b['doctorId'] ?? 0, $patientId, str($b['date'] ?? '', 10), str($b['time'] ?? '', 8));
    json_out(['id' => $id], 201);
}

// "Hapus" jadwal = tandai Dibatalkan agar riwayat tidak hilang.
function route_admin_appointment_cancel(int $id): void {
    guard('admin');
    run("UPDATE appointments SET status = 'cancelled' WHERE id = ? AND status IN ('scheduled','confirmed')", [$id])
        ? json_out(['ok' => true]) : fail('Jadwal tidak ditemukan atau sudah berjalan/selesai.', 404);
}
