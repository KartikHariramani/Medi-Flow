-- MediFlow SCHEMA MIGRATION V2
-- Run this in your Supabase SQL Editor to enable full scheduling features

-- 1. Update Appointments table with scheduling columns
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS time_slot TEXT NOT NULL DEFAULT '09:00 AM',
ADD COLUMN IF NOT EXISTS symptoms TEXT;

-- 2. Ensure Doctors list is public or has appropriate RLS for discovery
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by anyone" ON public.doctors
FOR SELECT USING (true);

-- 3. Verify real-time is enabled
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue;

-- 4. Sample Medical Reports for Discovery
-- (Optional: only if you want to test the reports tab immediately)
-- INSERT INTO public.health_reports (patient_id, file_url, report_type)
-- VALUES ('YOUR_PATIENT_ID', 'https://example.com/blood-report.pdf', 'Blood Test');

