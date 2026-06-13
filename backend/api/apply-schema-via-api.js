/**
 * MediFlow - Apply Schema via Supabase Management API
 * Uses the Supabase project management API (not direct PostgreSQL) to run SQL.
 * This works even when direct DB connections are blocked (IPv6-only projects).
 * 
 * Run: node apply-schema-via-api.js YOUR_PERSONAL_ACCESS_TOKEN
 * 
 * Get your PAT from: https://supabase.com/dashboard/account/tokens
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const PROJECT_REF = 'ilshthmfnllsrynjdxeh';

// SQL schema broken into individual statements (Management API runs one at a time)
const SQL_STATEMENTS = [
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
  
  `DO $$ BEGIN CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE appointment_priority AS ENUM ('normal', 'emergency'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE appointment_status AS ENUM ('waiting', 'in-consultation', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('turn_alert', 'emergency', 'reschedule', 'general'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  
  `CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'patient',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    specialization TEXT NOT NULL DEFAULT 'General',
    department TEXT NOT NULL DEFAULT 'General',
    avg_consultation_time INTEGER DEFAULT 15,
    is_verified BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dob DATE,
    blood_group TEXT,
    has_diabetes BOOLEAN DEFAULT FALSE,
    has_cancer BOOLEAN DEFAULT FALSE,
    other_conditions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS public.appointments (
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
  )`,
  
  `CREATE TABLE IF NOT EXISTS public.queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'general',
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS public.medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    condition TEXT,
    diagnosis TEXT,
    prescription TEXT,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS public.medicines (
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
  )`,
  
  `CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id, appointment_date)`,
  `CREATE INDEX IF NOT EXISTS idx_queue_doctor_position ON public.queue(doctor_id, position)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id)`,
  
  `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY`,
  
  `DO $$ BEGIN CREATE POLICY "Allow all on users" ON public.users USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE POLICY "Allow public read queue" ON public.queue FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE POLICY "Allow all queue" ON public.queue USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE POLICY "Allow public read appointments" ON public.appointments FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE POLICY "Allow all appointments" ON public.appointments USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE POLICY "Allow all on notifications" ON public.notifications USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
];

async function runSQL(pat, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pat}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function applySchema() {
  const pat = process.argv[2];
  if (!pat) {
    console.error('\n❌ Usage: node apply-schema-via-api.js YOUR_PERSONAL_ACCESS_TOKEN');
    console.error('   Get your PAT from: https://supabase.com/dashboard/account/tokens\n');
    process.exit(1);
  }

  console.log('\n🏥 MediFlow - Applying schema via Supabase Management API...\n');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < SQL_STATEMENTS.length; i++) {
    const sql = SQL_STATEMENTS[i].trim();
    const label = sql.substring(0, 60).replace(/\n/g, ' ') + '...';
    try {
      await runSQL(pat, sql);
      console.log(`✅ [${i + 1}/${SQL_STATEMENTS.length}] ${label}`);
      success++;
    } catch (err) {
      // Silently skip "already exists" type errors
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log(`⚪ [${i + 1}/${SQL_STATEMENTS.length}] Already exists (skipped): ${label}`);
        success++;
      } else {
        console.error(`❌ [${i + 1}/${SQL_STATEMENTS.length}] FAILED: ${label}`);
        console.error(`   Error: ${err.message.substring(0, 200)}`);
        failed++;
      }
    }
  }

  console.log(`\n📊 Results: ${success} succeeded, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 Schema applied successfully! Database is ready.\n');
  } else {
    console.log('⚠️  Some statements failed. Check errors above.\n');
  }
}

applySchema();
