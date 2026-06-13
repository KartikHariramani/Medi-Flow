/**
 * MediFlow - Seed Dummy Accounts via Supabase Auth signUp
 * Uses the public anon key — no admin/service role key needed.
 * Creates dummy doctor and patient accounts for demo/testing.
 * 
 * Run: node seed-demo-accounts.js
 * 
 * ACCOUNTS CREATED:
 * Doctors:  arjun@mediflow.com / password123
 *           priya@mediflow.com / password123
 * Patients: aarav@mediflow.com / password123
 *           ishaan@mediflow.com / password123
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const demoAccounts = [
  // Doctors
  { name: 'Dr. Arjun Mehta', email: 'arjun@mediflow.com', role: 'doctor', specialization: 'Cardiology', department: 'Heart Center' },
  { name: 'Dr. Priya Sharma', email: 'priya@mediflow.com', role: 'doctor', specialization: 'Neurology', department: 'Brain & Spine' },
  { name: 'Dr. Vikram Singh', email: 'vikram@mediflow.com', role: 'doctor', specialization: 'Orthopedics', department: 'Bone & Joint' },
  // Patients
  { name: 'Aarav Patel', email: 'aarav@mediflow.com', role: 'patient' },
  { name: 'Ishaan Khan', email: 'ishaan@mediflow.com', role: 'patient' },
  { name: 'Myra Kapoor', email: 'myra@mediflow.com', role: 'patient' },
];

const PASSWORD = 'password123';

async function createAccount(account) {
  console.log(`\n⏳ Creating ${account.role}: ${account.name} (${account.email})...`);

  // 1. Sign up via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: account.email,
    password: PASSWORD,
    options: { data: { name: account.name, role: account.role } },
  });

  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
      console.log(`   ⚪ Already exists — skipping auth creation.`);
      // Try to sign in to get the user ID
      const { data: signInData } = await supabase.auth.signInWithPassword({ email: account.email, password: PASSWORD });
      if (signInData?.user) {
        authData.user = signInData.user;
        authData.session = signInData.session;
      }
    } else {
      console.error(`   ❌ Auth error: ${authError.message}`);
      return;
    }
  }

  const user = authData?.user;
  if (!user) {
    console.error('   ❌ No user returned from sign up.');
    return;
  }

  // Set session to authenticate subsequent requests
  if (authData?.session) {
    await supabase.auth.setSession(authData.session);
  }

  // 2. Upsert into public.users
  const { error: userErr } = await supabase.from('users').upsert({
    id: user.id,
    name: account.name,
    email: account.email,
    role: account.role,
  });
  if (userErr) console.warn(`   ⚠️  users table: ${userErr.message}`);

  // 3. Create role-specific profile
  if (account.role === 'doctor') {
    const { error: docErr } = await supabase.from('doctors').upsert({
      user_id: user.id,
      specialization: account.specialization || 'General',
      department: account.department || 'General',
      is_verified: true,
      is_available: true,
    });
    if (docErr) console.warn(`   ⚠️  doctors table: ${docErr.message}`);
    else console.log(`   ✅ Doctor profile created.`);
  } else if (account.role === 'patient') {
    const { error: patErr } = await supabase.from('patients').upsert({ user_id: user.id });
    if (patErr) console.warn(`   ⚠️  patients table: ${patErr.message}`);
    else console.log(`   ✅ Patient profile created.`);
  }
}

async function run() {
  console.log('🏥 MediFlow Demo Account Seeder\n');
  console.log('Testing Supabase connection...');
  
  const { error: pingError } = await supabase.from('users').select('count').limit(0);
  if (pingError) {
    console.error(`\n❌ Cannot reach users table: ${pingError.message}`);
    console.error('   Make sure the database schema has been applied first!');
    console.error('   Run: node apply-schema-via-api.js YOUR_PAT\n');
    process.exit(1);
  }
  console.log('✅ Database connected!\n');

  for (const account of demoAccounts) {
    await createAccount(account);
    // Sign out between accounts so we can create fresh sessions
    await supabase.auth.signOut();
  }

  console.log('\n\n🎉 Demo accounts seeded! Login credentials:\n');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│  DOCTORS                                                      │');
  console.log('│  arjun@mediflow.com   /  password123  (Cardiology)          │');
  console.log('│  priya@mediflow.com   /  password123  (Neurology)           │');
  console.log('│  vikram@mediflow.com  /  password123  (Orthopedics)         │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│  PATIENTS                                                     │');
  console.log('│  aarav@mediflow.com   /  password123                        │');
  console.log('│  ishaan@mediflow.com  /  password123                        │');
  console.log('│  myra@mediflow.com    /  password123                        │');
  console.log('└─────────────────────────────────────────────────────────────┘\n');
}

run();
