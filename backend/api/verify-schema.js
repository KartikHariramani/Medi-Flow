import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('🔍 Checking Appointments Table Schema...');
  
  // Try to select the new columns
  const { data, error } = await supabase
    .from('appointments')
    .select('appointment_date, time_slot, symptoms')
    .limit(1);

  if (error) {
    console.error('❌ Schema Verification Failed:', error.message);
    if (error.message.includes('column does not exist')) {
       console.log('\n💡 CONFIRMED: The new columns (appointment_date, time_slot, symptoms) are missing from your Supabase database.');
       console.log('👉 ACTION REQUIRED: You must run the SQL in your Supabase SQL Editor.');
    }
  } else {
    console.log('✅ Schema Verification Passed: New columns exist.');
  }
}

check();
