<?php
declare(strict_types=1);

function route_patient_overview(): void {
    $p = patient_of(guard('patient'));
    $pid = (int) $p['id'];

    $appointments = q("SELECT a.id, a.appointment_date AS date, LEFT(a.appointment_time, 5) AS time, a.status,
            d.name AS doctor_name, d.specialty,
            COALESCE(pay.payment_status, 'none') AS payment_status
        FROM appointments a
        JOIN doctors d ON d.id = a.doctor_id
        LEFT JOIN payments pay ON pay.id = (SELECT MAX(id) FROM payments WHERE appointment_id = a.id)
        WHERE a.patient_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC", [$pid]);

    $records = q("SELECT mr.id, mr.visit_date AS date, mr.diagnosis, mr.treatment, mr.prescription, mr.notes, d.name AS doctor_name
        FROM medical_records mr JOIN doctors d ON d.id = mr.doctor_id
        WHERE mr.patient_id = ? ORDER BY mr.visit_date DESC, mr.id DESC", [$pid]);

    json_out([
        'patient' => ['id' => $pid, 'name' => $p['name']],
        'appointments' => $appointments,
        'records' => $records,
        'doctors' => q('SELECT id, name, specialty FROM doctors WHERE is_active = 1 ORDER BY name'),
        'fee' => consultation_fee(),
    ]);
}

function route_patient_appointment_create(): void {
    $p = patient_of(guard('patient'));
    $b = body();
    $id = create_appointment($b['doctorId'] ?? 0, (int)$p['id'], str($b['date'] ?? '', 10), str($b['time'] ?? '', 8));
    json_out(['id' => $id], 201);
}

function route_patient_payment_create(): void {
    $p = patient_of(guard('patient'));
    $b = body();
    $appointmentId = (int) ($b['appointmentId'] ?? 0);
    $method = str($b['method'] ?? '', 20);
    $proof = str($b['proof'] ?? '', 255);
    if (!in_array($method, ['debit', 'transfer', 'cash'], true)) fail('Pilih metode pembayaran.');

    $appt = q1('SELECT id, status FROM appointments WHERE id = ? AND patient_id = ?', [$appointmentId, $p['id']])
        ?? fail('Jadwal tidak ditemukan.', 404);
    if ($appt['status'] === 'cancelled') fail('Jadwal ini sudah dibatalkan.', 409);
    if (q1("SELECT id FROM payments WHERE appointment_id = ? AND payment_status IN ('pending','verified') LIMIT 1", [$appointmentId])) {
        fail('Pembayaran untuk jadwal ini sudah diajukan.', 409);
    }
    // Status 'pending' sampai resepsionis memverifikasi.
    run("INSERT INTO payments (appointment_id, patient_id, amount, payment_method, payment_status, payment_proof)
         VALUES (?,?,?,?, 'pending', ?)", [$appointmentId, $p['id'], consultation_fee(), $method, $proof ?: null]);
    json_out(['ok' => true], 201);
}
