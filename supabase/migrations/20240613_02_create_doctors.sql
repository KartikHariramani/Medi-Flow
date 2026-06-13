-- 2024-06-13: Create doctors table (profile for users with role 'doctor')
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- ensure UUID support (id reuse safe)

CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  specialty text,
  avg_consult_time int, -- average consultation time in minutes
  department_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Index for quick doctor lookup by specialty
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
