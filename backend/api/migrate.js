import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is missing in backend/api/.env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('⏳ Running PostgreSQL Migration on Supabase...');
  try {
    await client.connect();
    console.log('✅ Connected to database.');

    // Add travel columns to appointments table
    console.log('⏳ Altering appointments table...');
    await client.query(`
      ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS live_location TEXT;
      ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS travel_distance TEXT;
      ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS travel_duration INTEGER; -- in minutes
      ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS departure_recommendation TEXT;
      ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS travel_status TEXT DEFAULT 'on_time';
    `);
    console.log('✅ Travel columns added successfully.');

    // Verify current columns in appointments
    const { rows } = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' AND table_schema = 'public';
    `);
    console.log('\n📋 Current columns in appointments table:');
    rows.forEach(col => console.log(`   - ${col.column_name} (${col.data_type})`));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

migrate();
