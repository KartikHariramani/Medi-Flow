-- MediFlow Database Repair Script
-- Run this in your Supabase SQL Editor to synchronize the schema.

-- 1. Ensure Appointments table has all required columns
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS time_slot TEXT NOT NULL DEFAULT '09:00 AM',
ADD COLUMN IF NOT EXISTS symptoms TEXT,
ADD COLUMN IF NOT EXISTS estimated_wait_time INTEGER;

-- 2. Ensure Queue table has proper indexing
ALTER TABLE public.queue
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Optimization: Add index for faster dashboard lookups
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_queue_doctor ON public.queue(doctor_id);

-- 4. Refresh Cache (Note: PostgREST usually detects DDL changes, but this ensures it)
NOTIFY pgrst, 'reload schema';

