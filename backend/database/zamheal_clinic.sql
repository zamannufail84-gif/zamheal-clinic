-- =====================================================================
-- Zamheal Clinic - skema + data contoh (satu file, aman diimpor ulang)
-- Impor lewat phpMyAdmin (tab Import) atau: mysql -u root < zamheal_clinic.sql
-- PERINGATAN: file ini MENGHAPUS tabel lama bernama sama lalu membuat ulang.
-- Semua akun contoh berpassword: password123
-- =====================================================================
CREATE DATABASE IF NOT EXISTS zamheal_clinic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE zamheal_clinic;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS payments, medical_records, doctor_attendance, appointments,
  login_history, receptionists, patients, doctors, admins, users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','doctor','patient','receptionist') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE login_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT,
  logged_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  license_number VARCHAR(50),
  education TEXT,
  experience_years INT DEFAULT 0,
  bio TEXT,
  photo_url VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NULL,
  phone VARCHAR(20),
  address TEXT,
  date_of_birth DATE,
  gender ENUM('male','female'),
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE receptionists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  shift VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status ENUM('scheduled','confirmed','in_progress','completed','cancelled') DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  INDEX idx_appt_doctor_slot (doctor_id, appointment_date, appointment_time)
);

CREATE TABLE medical_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_id INT NULL,
  visit_date DATE NOT NULL,
  diagnosis TEXT,
  treatment TEXT,
  prescription TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  patient_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('debit','transfer','cash') NOT NULL,
  payment_status ENUM('pending','verified','failed') DEFAULT 'pending',
  payment_proof VARCHAR(255),
  payment_date TIMESTAMP NULL,
  verified_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES receptionists(id) ON DELETE SET NULL
);

CREATE TABLE doctor_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  status ENUM('present','absent','late') DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attendance_day (doctor_id, attendance_date),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- DATA CONTOH (password semua akun: password123)
-- ---------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, role) VALUES
(1,'admin','admin@zamheal.com','$2y$12$2wXt9xQjksSiaaaZDhg/WeuNo.DAithSFiL/rPShIftXQYTVw7Y9S','admin'),
(2,'resepsionis','resepsionis@zamheal.com','$2y$12$2wXt9xQjksSiaaaZDhg/WeuNo.DAithSFiL/rPShIftXQYTVw7Y9S','receptionist'),
(3,'dokter1','dokter1@zamheal.com','$2y$12$2wXt9xQjksSiaaaZDhg/WeuNo.DAithSFiL/rPShIftXQYTVw7Y9S','doctor'),
(4,'dokter2','dokter2@zamheal.com','$2y$12$2wXt9xQjksSiaaaZDhg/WeuNo.DAithSFiL/rPShIftXQYTVw7Y9S','doctor'),
(5,'dokter3','dokter3@zamheal.com','$2y$12$2wXt9xQjksSiaaaZDhg/WeuNo.DAithSFiL/rPShIftXQYTVw7Y9S','doctor'),
(6,'dokter4','dokter4@zamheal.com','$2y$12$2wXt9xQjksSiaaaZDhg/WeuNo.DAithSFiL/rPShIftXQYTVw7Y9S','doctor'),
(7,'pasien1','pasien1@zamheal.com','$2y$12$2wXt9xQjksSiaaaZDhg/WeuNo.DAithSFiL/rPShIftXQYTVw7Y9S','patient');

INSERT INTO admins (user_id, name, phone) VALUES (1,'Administrator Zamheal','081234567890');
INSERT INTO receptionists (user_id, name, phone, shift) VALUES (2,'Dewi Sartika','081234567891','pagi');

INSERT INTO doctors (id, user_id, name, specialty, phone, license_number, education, experience_years, bio, photo_url) VALUES
(1,3,'Dr. Ahmad Santoso, Sp.PD','Spesialis Penyakit Dalam','081234567892','DOC001',
 'S1 Kedokteran Universitas Indonesia (2010-2016)\nS2 Spesialis Penyakit Dalam RSCM (2017-2021)',8,
 'Dokter spesialis penyakit dalam dengan pengalaman 8 tahun menangani berbagai kasus medis.',
 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80'),
(2,4,'Dr. Siti Nurhaliza, Sp.A','Spesialis Anak','081234567893','DOC002',
 'S1 Kedokteran Universitas Gadjah Mada (2008-2014)\nS2 Spesialis Anak RSUP Dr. Sardjito (2015-2019)',10,
 'Dokter spesialis anak yang berpengalaman dalam kesehatan bayi, anak, dan remaja.',
 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80'),
(3,5,'Dr. Budi Santoso, Sp.JP','Spesialis Jantung','081234567894','DOC003',
 'S1 Kedokteran Universitas Airlangga (2006-2012)\nS2 Spesialis Jantung RS Jantung Harapan Kita (2013-2017)',12,
 'Dokter spesialis jantung dan pembuluh darah dengan pengalaman 12 tahun.',
 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80'),
(4,6,'Dr. Sari Dewi, Sp.OG','Spesialis Kandungan','081234567895','DOC004',
 'S1 Kedokteran Universitas Padjadjaran (2009-2015)\nS2 Spesialis Obstetri Ginekologi RSHS Bandung (2016-2020)',9,
 'Dokter spesialis kandungan dan kebidanan, berpengalaman dalam persalinan dan kesehatan reproduksi wanita.',
 'https://images.unsplash.com/photo-1594824475317-29bb4b71e3e3?auto=format&fit=crop&w=400&q=80');

-- Pasien 1 punya akun login (pasien1); pasien 2 & 3 didaftarkan resepsionis (tanpa akun)
INSERT INTO patients (id, user_id, name, email, phone, address, date_of_birth, gender) VALUES
(1,7,'John Doe','pasien1@zamheal.com','081234567896','Jl. Merdeka No. 123, Medan, Sumatera Utara','1990-01-01','male'),
(2,NULL,'Jane Smith','jane@email.com','081234567897','Jl. Sudirman No. 45, Medan','2000-05-12','female'),
(3,NULL,'Bob Johnson','bob@email.com','081234567898','Jl. Gatot Subroto No. 8, Medan','1980-09-30','male');

INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, status, notes) VALUES
(1,1,1,CURDATE(),'09:00:00','confirmed',NULL),
(2,2,2,CURDATE(),'10:00:00','completed','Demam ringan'),
(3,3,1,DATE_ADD(CURDATE(), INTERVAL 1 DAY),'11:00:00','scheduled',NULL),
(4,1,2,DATE_SUB(CURDATE(), INTERVAL 5 DAY),'10:00:00','completed','Pemeriksaan rutin'),
(5,1,1,DATE_SUB(CURDATE(), INTERVAL 10 DAY),'08:30:00','completed','Kontrol tekanan darah');

INSERT INTO medical_records (patient_id, doctor_id, appointment_id, visit_date, diagnosis, treatment, prescription, notes) VALUES
(2,2,2,CURDATE(),'Demam ringan','Istirahat cukup dan banyak minum','Paracetamol 3x1','Kontrol bila demam > 3 hari'),
(1,2,4,DATE_SUB(CURDATE(), INTERVAL 5 DAY),'Pemeriksaan rutin','Vitamin C','Vitamin C 1x1','Kondisi baik'),
(1,1,5,DATE_SUB(CURDATE(), INTERVAL 10 DAY),'Tekanan darah normal','Pola makan sehat','-','Kontrol 3 bulan lagi');

INSERT INTO payments (appointment_id, patient_id, amount, payment_method, payment_status, payment_proof, payment_date, verified_by) VALUES
(4,1,150000,'transfer','verified','bukti_transfer.jpg',DATE_SUB(NOW(), INTERVAL 5 DAY),1),
(5,1,150000,'cash','verified',NULL,DATE_SUB(NOW(), INTERVAL 10 DAY),1),
(2,2,150000,'transfer','pending','bukti_jane.jpg',NOW(),NULL);

INSERT INTO doctor_attendance (doctor_id, attendance_date, check_in_time, check_out_time, status) VALUES
(1,DATE_SUB(CURDATE(), INTERVAL 1 DAY),'08:00:00','16:00:00','present'),
(2,CURDATE(),'08:05:00',NULL,'present');
