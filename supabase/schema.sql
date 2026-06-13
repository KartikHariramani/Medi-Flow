-- MediFlow Supabase Schema
-- Run this in your Supabase SQL Editor

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');
CREATE TYPE appointment_priority AS ENUM ('normal', 'emergency');
CREATE TYPE appointment_status AS ENUM ('waiting', 'in-consultation', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('turn_alert', 'emergency', 'reschedule', 'general');

-- 2. USERS (Extends Supabase Auth optionally, but standalone table for business logic)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'patient',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DOCTORS
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL,
  department TEXT NOT NULL,
  avg_consultation_time INTEGER DEFAULT 15, -- in minutes
  is_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PATIENTS
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dob DATE,
  blood_group TEXT,
  has_diabetes BOOLEAN DEFAULT FALSE,
  has_cancer BOOLEAN DEFAULT FALSE,
  other_conditions TEXT[], -- Array of strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. HEALTH QUESTIONNAIRE
CREATE TABLE public.health_questionnaire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. MEDICAL HISTORY
CREATE TABLE public.medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  condition TEXT,
  diagnosis TEXT,
  prescription TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. HEALTH REPORTS
CREATE TABLE public.health_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  report_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. APPOINTMENTS
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  time_slot TEXT NOT NULL DEFAULT '09:00 AM',
  token_number INTEGER NOT NULL,
  priority appointment_priority DEFAULT 'normal',
  status appointment_status DEFAULT 'waiting',
  booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_wait_time INTEGER, -- in minutes
  symptoms TEXT,
  qr_code_url TEXT,
  reminder_sent BOOLEAN DEFAULT false
);

-- 9. LIVE QUEUE (Powers Realtime Updates)
CREATE TABLE public.queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for the queue table specifically so Web/Mobile apps can subscribe to position changes
alter publication supabase_realtime add table public.queue;
alter publication supabase_realtime add table public.appointments;

-- 10. MEDICINES (Medicine Schedule and Reminders)
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL, -- e.g., "500mg", "2 tablets"
  frequency TEXT DEFAULT 'daily', -- e.g., 'daily', 'twice-daily', 'weekly'
  timing TEXT NOT NULL, -- e.g., "09:00 AM", "02:00 PM"
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL means ongoing
  is_active BOOLEAN DEFAULT TRUE,
  reminder_sent_today BOOLEAN DEFAULT FALSE,
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'general',
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security: Row Level Security (RLS) - Turn it on
-- Note: In a real app we configure more robust policies. These placeholders let users see their own data.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to queue" on public.queue FOR SELECT USING (true);
CREATE POLICY "Allow public read access to appointments" on public.appointments FOR SELECT USING (true);

