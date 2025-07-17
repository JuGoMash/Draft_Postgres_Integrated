# Database Management Guide

## Overview

This guide explains how to manage your medical platform's database, including adding doctors, viewing customer signups, and monitoring appointments.

## Database Structure

### Main Tables
- **users** - All user accounts (patients, doctors, admins)
- **doctors** - Doctor profiles and practice information
- **appointments** - Booking records
- **reviews** - Patient feedback
- **notifications** - System messages
- **availability_slots** - Doctor scheduling

## Adding New Doctors

### Method 1: Using the SQL Tool
You can add doctors directly through the SQL interface:

```sql
-- First, create a user account
INSERT INTO users (email, password, first_name, last_name, phone, role, is_verified)
VALUES ('dr.newdoctor@example.com', '$2b$10$...', 'John', 'Doe', '+1234567890', 'doctor', true);

-- Then create the doctor profile (use the user ID from above)
INSERT INTO doctors (user_id, specialty, license_number, experience, education, languages, bio, clinic_name, clinic_address, latitude, longitude, consultation_fee, rating, review_count, is_accepting_patients, services_offered, insurances_accepted, availability_schedule)
VALUES (5, 'Neurology', 'MD654321', 15, 'Mayo Clinic Medical School', ARRAY['English', 'Spanish'], 'Expert neurologist with 15 years experience', 'NeuroHealth Center', '123 Brain St, Boston, MA 02101', 42.3601, -71.0589, 300.00, 0.00, 0, true, ARRAY['Brain Surgery', 'Consultations', 'MRI Reading'], ARRAY['Blue Cross', 'Aetna', 'Medicare'], '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}}');
```

### Method 2: Using the Registration API
Doctors can register through the frontend registration form, which will create both user and doctor records.

## Viewing Customer Signups

### View All Users
```sql
SELECT id, email, first_name, last_name, phone, role, is_verified, created_at 
FROM users 
ORDER BY created_at DESC;
```

### View New Patient Signups (Last 30 Days)
```sql
SELECT id, email, first_name, last_name, phone, created_at 
FROM users 
WHERE role = 'patient' 
AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

### View New Doctor Applications
```sql
SELECT u.id, u.email, u.first_name, u.last_name, d.specialty, d.license_number, d.is_accepting_patients, u.created_at
FROM users u
JOIN doctors d ON u.id = d.user_id
WHERE u.role = 'doctor'
ORDER BY u.created_at DESC;
```

## Monitoring Appointments

### View All Appointments
```sql
SELECT 
    a.id,
    a.appointment_date,
    a.status,
    a.type,
    p.first_name || ' ' || p.last_name as patient_name,
    p.email as patient_email,
    d.clinic_name,
    doc_user.first_name || ' ' || doc_user.last_name as doctor_name,
    a.created_at as booked_at
FROM appointments a
JOIN users p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
JOIN users doc_user ON d.user_id = doc_user.id
ORDER BY a.appointment_date DESC;
```

### View Recent Bookings (Last 7 Days)
```sql
SELECT 
    a.id,
    a.appointment_date,
    a.status,
    p.first_name || ' ' || p.last_name as patient_name,
    p.email as patient_email,
    d.clinic_name,
    a.created_at as booked_at
FROM appointments a
JOIN users p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
WHERE a.created_at >= NOW() - INTERVAL '7 days'
ORDER BY a.created_at DESC;
```

### View Appointment Statistics
```sql
SELECT 
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
FROM appointments;
```

## Managing Doctor Availability

### View Doctor Availability
```sql
SELECT 
    d.clinic_name,
    u.first_name || ' ' || u.last_name as doctor_name,
    as_slot.date,
    as_slot.start_time,
    as_slot.end_time,
    as_slot.is_booked
FROM availability_slots as_slot
JOIN doctors d ON as_slot.doctor_id = d.id
JOIN users u ON d.user_id = u.id
WHERE as_slot.date >= CURRENT_DATE
ORDER BY d.clinic_name, as_slot.date, as_slot.start_time;
```

### Add Availability Slots for a Doctor
```sql
-- Add slots for a specific doctor (replace doctor_id with actual ID)
INSERT INTO availability_slots (doctor_id, date, start_time, end_time, is_booked)
VALUES 
(1, '2025-07-20', '2025-07-20 09:00:00', '2025-07-20 09:30:00', false),
(1, '2025-07-20', '2025-07-20 09:30:00', '2025-07-20 10:00:00', false),
(1, '2025-07-20', '2025-07-20 10:00:00', '2025-07-20 10:30:00', false);
```

## User Management

### View User Activity
```sql
SELECT 
    role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_count
FROM users
GROUP BY role;
```

### Verify a User
```sql
UPDATE users 
SET is_verified = true 
WHERE email = 'user@example.com';
```

### Update Doctor Status
```sql
UPDATE doctors 
SET is_accepting_patients = false 
WHERE id = 1;
```

## Payment Information

### View Payment Status
```sql
SELECT 
    a.id,
    a.appointment_date,
    a.payment_status,
    a.payment_intent_id,
    p.first_name || ' ' || p.last_name as patient_name,
    d.consultation_fee
FROM appointments a
JOIN users p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
WHERE a.payment_status IS NOT NULL
ORDER BY a.created_at DESC;
```

## Reviews and Ratings

### View All Reviews
```sql
SELECT 
    r.rating,
    r.comment,
    r.created_at,
    p.first_name || ' ' || p.last_name as patient_name,
    doc_user.first_name || ' ' || doc_user.last_name as doctor_name,
    d.clinic_name
FROM reviews r
JOIN users p ON r.patient_id = p.id
JOIN doctors d ON r.doctor_id = d.id
JOIN users doc_user ON d.user_id = doc_user.id
ORDER BY r.created_at DESC;
```

### Update Doctor Ratings
The system automatically updates doctor ratings when reviews are added, but you can manually trigger an update:
```sql
-- This will recalculate the average rating for doctor ID 1
UPDATE doctors 
SET rating = (
    SELECT COALESCE(AVG(rating), 0) 
    FROM reviews 
    WHERE doctor_id = 1
),
review_count = (
    SELECT COUNT(*) 
    FROM reviews 
    WHERE doctor_id = 1
)
WHERE id = 1;
```

## Backup and Maintenance

### Export User Data
```sql
COPY users TO '/tmp/users_backup.csv' WITH CSV HEADER;
```

### Export Appointment Data
```sql
COPY appointments TO '/tmp/appointments_backup.csv' WITH CSV HEADER;
```

## Important Notes

1. **Password Security**: User passwords are hashed with bcrypt. Never store plain text passwords.

2. **Data Integrity**: Always use the provided API endpoints when possible, as they include proper validation and business logic.

3. **Cascading Deletes**: Be careful when deleting users - this may affect related appointments and reviews.

4. **Time Zones**: All timestamps are stored in UTC. Consider time zone conversion for display purposes.

5. **Backups**: Regular database backups are recommended before making bulk changes.

## Quick Reference Commands

```sql
-- Count total users by role
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Count appointments by status
SELECT status, COUNT(*) FROM appointments GROUP BY status;

-- Find doctors with most appointments
SELECT d.clinic_name, COUNT(a.id) as appointment_count
FROM doctors d
LEFT JOIN appointments a ON d.id = a.doctor_id
GROUP BY d.id, d.clinic_name
ORDER BY appointment_count DESC;

-- Find most popular specialties
SELECT specialty, COUNT(*) as doctor_count
FROM doctors
GROUP BY specialty
ORDER BY doctor_count DESC;
```