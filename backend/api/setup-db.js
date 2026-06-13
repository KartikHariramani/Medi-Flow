import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('\n❌ DATABASE_URL is missing from your .env file.');
  console.error('   Go to Supabase Dashboard > Project Settings > Database');
  console.error('   Copy the "Connection string (URI)" and paste it in backend/api/.env as:');
  console.error('   DATABASE_URL=postgresql://postgres.[ref]:[password]@...\n');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function setup() {
  console.log('\n🏥 MediFlow Database Setup\n');

  try {
    console.log('⏳ Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read schema.sql
    const schemaPath = path.resolve(__dirname, '../../supabase/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('⏳ Creating tables, enums, and policies...');
    await client.query(schema);
    console.log('✅ All tables created successfully!\n');

    // Seed an admin user so you can test admin routes
    console.log('⏳ Seeding admin user...');
    await client.query(`
      INSERT INTO public.users (name, email, role)
      VALUES ('Admin', 'admin@MediFlow.com', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log('✅ Admin user seeded (admin@MediFlow.com)\n');

    // Verify tables exist
    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log('📋 Tables in database:');
    rows.forEach(r => console.log(`   ✓ ${r.table_name}`));
    console.log('\n🎉 Database setup complete! Backend is ready to use.\n');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Some tables already exist — that\'s fine, skipping.\n');
      
      // Verify tables exist anyway
      const { rows } = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);
      console.log('📋 Existing tables:');
      rows.forEach(r => console.log(`   ✓ ${r.table_name}`));
      console.log('\n🎉 Database is already set up!\n');
    } else {
      console.error('❌ Setup failed:', error.message);
    }
  } finally {
    await client.end();
  }
}

setup();

