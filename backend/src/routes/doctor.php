<?php
declare(strict_types=1);

function route_doctor_overview(): void {
    $doc = doctor_of(guard('doctor'));
    $id = (int) $doc['id'];

    $appointments = q("SELECT a.id, a.appointment_date AS date, LEFT(a.appointment_time, 5) AS time, a.status, a.notes,
            p.name AS patient_name, p.phone AS patient_phone, mr.diagnosis, mr.treatment, mr.prescription
        FROM appointments a
        JOIN patients p ON p.id = a.patient_id
        LEFT JOIN medical_records mr ON mr.appointment_id = a.id
        WHERE a.doctor_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC", [$id]);

    $patients = q("SELECT p.id, p.name, p.phone, p.address, p.date_of_birth,
            COUNT(a.id) AS visit_count, MAX(a.appointment_date) AS last_visit
        FROM patients p JOIN appointments a ON a.patient_id = p.id
        WHERE a.doctor_id = ? AND a.status <> 'cancelled'
        GROUP BY p.id, p.name, p.phone, p.address, p.date_of_birth
        ORDER BY last_visit DESC", [$id]);

    $attendance = q1("SELECT LEFT(check_in_time,5) AS check_in, LEFT(check_out_time,5) AS check_out, status
        FROM doctor_attendance WHERE doctor_id = ? AND attendance_date = CURDATE()", [$id]);

    $today = db_today();
    $stats = [
        'today' => count(array_filter($appointments, fn($a) => $a['date'] === $today && $a['status'] !== 'cancelled')),
        'patients' => count($patients),
        'completed' => count(array_filter($appointments, fn($a) => $a['status'] === 'completed')),
        'waiting' => count(array_filter($appointments, fn($a) => in_array($a['status'], ['scheduled', 'confirmed'], true))),
    ];

    json_out([
        'doctor' => ['id' => $id, 'name' => $doc['name'], 'specialty' => $doc['specialty']],
        'appointments' => $appointments, 'patients' => $patients, 'attendance' => $attendance, 'stats' => $stats,
    ]);
}

function route_doctor_appointment_update(int $id): void {
    $doc = doctor_of(guard('doctor'));
    $b = body();
    $status = str($b['status'] ?? '', 20);
    if (!in_array($status, ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'], true)) fail('Status tidak valid.');

    $appt = q1('SELECT id, patient_id, appointment_date FROM appointments WHERE id = ? AND doctor_id = ?', [$id, $doc['id']])
        ?? fail('Jadwal tidak ditemukan.', 404);

    $notes = str($b['notes'] ?? '', 2000);
    $diagnosis = str($b['diagnosis'] ?? '', 2000);
    $treatment = str($b['treatment'] ?? '', 2000);
    $prescription = str($b['prescription'] ?? '', 2000);

    $pdo = db();
    $pdo->beginTransaction();
    try {
        run('UPDATE appointments SET status = ?, notes = ? WHERE id = ?', [$status, $notes ?: null, $id]);
        if ($status === 'completed' && ($diagnosis || $treatment || $prescription || $notes)) {
            $args = [$diagnosis ?: null, $treatment ?: null, $prescription ?: null, $notes ?: null];
            if (q1('SELECT id FROM medical_records WHERE appointment_id = ?', [$id])) {
                run('UPDATE medical_records SET diagnosis=?, treatment=?, prescription=?, notes=? WHERE appointment_id=?', [...$args, $id]);
            } else {
                run('INSERT INTO medical_records (patient_id, doctor_id, appointment_id, visit_date, diagnosis, treatment, prescription, notes)
                     VALUES (?,?,?,?,?,?,?,?)', [$appt['patient_id'], $doc['id'], $id, $appt['appointment_date'], ...$args]);
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
    json_out(['ok' => true]);
}

function route_doctor_attendance(): void {
    $doc = doctor_of(guard('doctor'));
    $action = str(body()['action'] ?? '', 20);
    $row = q1('SELECT id, check_out_time FROM doctor_attendance WHERE doctor_id = ? AND attendance_date = CURDATE()', [$doc['id']]);

    if ($action === 'check_in') {
        if ($row) fail('Anda sudah absen masuk hari ini.', 409);
        // Terlambat bila masuk lewat pukul 09:00.
        run("INSERT INTO doctor_attendance (doctor_id, attendance_date, check_in_time, status)
             VALUES (?, CURDATE(), CURTIME(), IF(CURTIME() > '09:00:00', 'late', 'present'))", [$doc['id']]);
        json_out(['ok' => true], 201);
    }
    if ($action === 'check_out') {
        if (!$row) fail('Anda belum absen masuk hari ini.', 409);
        if ($row['check_out_time']) fail('Anda sudah absen pulang hari ini.', 409);
        run('UPDATE doctor_attendance SET check_out_time = CURTIME() WHERE id = ?', [$row['id']]);
        json_out(['ok' => true]);
    }
    fail('Aksi tidak valid.');
}
