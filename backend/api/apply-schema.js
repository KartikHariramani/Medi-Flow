/**
 * MediFlow - Apply Schema to Supabase
 * This script connects via DATABASE_URL (direct PostgreSQL) and applies the full schema.
 * Run: node apply-schema.js
 */
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL missing from backend/api/.env');
  console.error('   Get it from: Supabase Dashboard > Project Settings > Database > Connection string (URI)');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const SCHEMA = `
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMs (safe to re-run)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_priority AS ENUM ('normal', 'emergency');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('waiting', 'in-consultation', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('turn_alert', 'emergency', 'reschedule', 'general');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1. USERS
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'patient',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DOCTORS
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL DEFAULT 'General',
  department TEXT NOT NULL DEFAULT 'General',
  avg_consultation_time INTEGER DEFAULT 15,
  is_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PATIENTS
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dob DATE,
  blood_group TEXT,
  has_diabetes BOOLEAN DEFAULT FALSE,
  has_cancer BOOLEAN DEFAULT FALSE,
  other_conditions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  time_slot TEXT NOT NULL DEFAULT '09:00 AM',
  token_number INTEGER NOT NULL,
  priority appointment_priority DEFAULT 'normal',
  status appointment_status DEFAULT 'waiting',
  booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_wait_time INTEGER,
  symptoms TEXT,
  qr_code_url TEXT,
  reminder_sent BOOLEAN DEFAULT false
);

-- 5. QUEUE
CREATE TABLE IF NOT EXISTS public.queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'general',
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. MEDICAL HISTORY
CREATE TABLE IF NOT EXISTS public.medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  condition TEXT,
  diagnosis TEXT,
  prescription TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. MEDICINES
CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT DEFAULT 'daily',
  timing TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  reminder_sent_today BOOLEAN DEFAULT FALSE,
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_queue_doctor_position ON public.queue(doctor_id, position);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- Enable Realtime for live queue updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Basic permissive policies for demo
CREATE POLICY "Allow public read queue" ON public.queue FOR SELECT USING (true);
CREATE POLICY "Allow public read appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow all on users" ON public.users USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on notifications" ON public.notifications USING (true) WITH CHECK (true);
`;

async function applySchema() {
  console.log('\n🏥 MediFlow Schema Setup\n');
  try {
    console.log('⏳ Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('⏳ Applying schema...');
    await client.query(SCHEMA);
    console.log('✅ Schema applied!\n');

    // Verify tables
    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log('📋 Tables in database:');
    rows.forEach(r => console.log(`   ✓ ${r.table_name}`));
    console.log('\n🎉 Database is ready!\n');

  } catch (err) {
    // If realtime publication already has the table that's fine
    if (err.message?.includes('already member of publication')) {
      console.log('✅ Realtime already configured — skipping.\n');
    } else {
      console.error('❌ Schema error:', err.message);
    }
  } finally {
    await client.end();
  }
}

applySchema();
