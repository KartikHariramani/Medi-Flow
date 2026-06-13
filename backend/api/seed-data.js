import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seed() {
  console.log('🏥 Seeding MediFlow Smart Hospital Data (Indian Context)...\n');

  const indianDoctors = [
    { name: 'Dr. Arjun Mehta', email: 'arjun@MediFlow.com', spec: 'Cardiology', dept: 'Heart Center' },
    { name: 'Dr. Priya Sharma', email: 'priya@MediFlow.com', spec: 'Neurology', dept: 'Brain & Spine' },
    { name: 'Dr. Vikram Singh', email: 'vikram@MediFlow.com', spec: 'Orthopedics', dept: 'Bone & Joint' },
    { name: 'Dr. Ananya Iyer', email: 'ananya@MediFlow.com', spec: 'Pediatrics', dept: 'Child Care' },
    { name: 'Dr. Sanjay Verma', email: 'sanjay@MediFlow.com', spec: 'Dermatology', dept: 'Skin Clinic' },
    { name: 'Dr. Sunita Rao', email: 'sunita@MediFlow.com', spec: 'Gynecology', dept: 'Womens Health' },
    { name: 'Dr. Rajesh Gupta', email: 'rajesh@MediFlow.com', spec: 'General Medicine', dept: 'Primary Care' }
  ];

  const indianPatients = [
    { name: 'Aarav Patel', email: 'aarav@MediFlow.com', bg: 'O+', diabetes: false },
    { name: 'Ishaan Khan', email: 'ishaan@MediFlow.com', bg: 'A+', diabetes: true },
    { name: 'Myra Kapoor', email: 'myra@MediFlow.com', bg: 'B+', diabetes: false },
    { name: 'Diya Reddy', email: 'diya@MediFlow.com', bg: 'AB+', diabetes: false },
    { name: 'Vivaan Joshi', email: 'vivaan@MediFlow.com', bg: 'O-', diabetes: true },
    { name: 'Saisha Gupta', email: 'saisha@MediFlow.com', bg: 'A-', diabetes: false },
    { name: 'Kabir Malhotra', email: 'kabir@MediFlow.com', bg: 'B-', diabetes: false }
  ];

  // 1. Seed Doctors
  for (const d of indianDoctors) {
    console.log(`⏳ Onboarding Doctor: ${d.name}...`);
    const { data: authUser } = await supabase.auth.admin.createUser({
      email: d.email, password: 'password123', email_confirm: true, user_metadata: { name: d.name, role: 'doctor' }
    });
    
    if (authUser?.user) {
      const uid = authUser.user.id;
      await supabase.from('users').upsert({ id: uid, name: d.name, email: d.email, role: 'doctor' });
      await supabase.from('doctors').upsert({ user_id: uid, specialization: d.spec, department: d.dept, is_verified: true });
      console.log(`   ✅ Dr. ${d.name} onboarded.`);
    }
  }

  // 2. Seed Patients
  for (const p of indianPatients) {
    console.log(`⏳ Onboarding Patient: ${p.name}...`);
    const { data: authUser } = await supabase.auth.admin.createUser({
      email: p.email, password: 'password123', email_confirm: true, user_metadata: { name: p.name, role: 'patient' }
    });

    if (authUser?.user) {
      const uid = authUser.user.id;
      await supabase.from('users').upsert({ id: uid, name: p.name, email: p.email, role: 'patient' });
      const { data: pData } = await supabase.from('patients').upsert({ 
        user_id: uid, blood_group: p.bg, has_diabetes: p.diabetes 
      }).select().single();

      if (pData) {
        // Seed Medical History (Reports)
        await supabase.from('medical_history').insert([
          { 
            patient_id: pData.id, 
            condition: 'Routine Checkup', 
            diagnosis: 'Stable condition, maintains healthy diet.', 
            prescription: 'Vitamin D3 supplements' 
          },
          { 
            patient_id: pData.id, 
            condition: p.diabetes ? 'Diabetes Management' : 'Flu Symptoms', 
            diagnosis: p.diabetes ? 'HbA1c levels slightly high' : 'Seasonal viral infection', 
            prescription: p.diabetes ? 'Metformin 500mg' : 'Paracetamol 650mg'
          }
        ]);
      }
      console.log(`   ✅ Patient ${p.name} onboarded.`);
    }
  }

  console.log('\n🎉 Seeding Complete! System enriched with Indian healthcare profiles.');
}

seed();

