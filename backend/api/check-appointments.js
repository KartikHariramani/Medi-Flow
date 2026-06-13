import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('🔍 Checking Appointments and Doctors...');
  
   const { data: appts } = await supabase.from('appointments').select('id, doctor_id, appointment_date, status').limit(5);
  console.log('\n📅 Recent Appointments:');
  console.table(appts || []);

  const { data: doctors } = await supabase.from('doctors').select('id, user_id, users(name)').limit(5);
  console.log('\n👨‍⚕️ Doctors in DB:');
  console.table((doctors || []).map(d => ({ id: d.id, name: d.users?.name || 'Unknown' })));

  const { data: patients } = await supabase.from('patients').select('id, user_id, users(name)').limit(5);
  console.log('\n👤 Patients in DB:');
  console.table((patients || []).map(p => ({ id: p.id, name: p.users?.name || 'Unknown' })));

  if (appts && appts.length > 0 && doctors) {
    const firstDocId = doctors[0].id;
    const matchCount = appts.filter(a => a.doctor_id === firstDocId).length;
    console.log(`\n📊 Match check for ${doctors[0].users?.name}: ${matchCount} appointments found.`);
  }
}

check();
