-- 2024-06-13: Create users table for authentication and role management
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- ensure UUID generation support

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
  created_at timestamp with time zone DEFAULT now()
);

-- Index for quick email lookup (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
