import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testBooking() {
  console.log('🧪 Testing Manual Appointment Insertion...');

  // 1. Get a Doctor ID
  const { data: doc } = await supabase.from('doctors').select('id, users(name)').limit(1).single();
  console.log(`👨‍⚕️ Using Doctor: ${doc.users.name} (${doc.id})`);

  // 2. Get a Patient ID
  const { data: pat } = await supabase.from('patients').select('id, users(name)').limit(1).single();
  console.log(`👤 Using Patient: ${pat.users.name} (${pat.id})`);

  // 3. Attempt Insert
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      patient_id: pat.id,
      doctor_id: doc.id,
      token_number: 999,
      priority: 'normal',
      status: 'waiting',
      appointment_date: '2026-04-08',
      time_slot: '09:00 AM',
      symptoms: 'Test Symptoms',
      estimated_wait_time: 15
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Insert Failed:', error);
  } else {
    console.log('✅ Insert Successful:', data.id);
  }
}

testBooking();
