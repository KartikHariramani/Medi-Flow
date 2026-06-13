import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ilshthmfnllsrynjdxeh.supabase.co';
const supabaseKey = 'sb_publishable_q9swVQntvEpbL-A27H6t5w_1rXTRn12';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('⏳ Querying Supabase Rest API...');
  
  // Try to query a dummy endpoint or see if it connects
  const { data, error } = await supabase.from('users').select('*').limit(1);
  
  if (error) {
    console.error('❌ API Query Failed:');
    console.error(error);
  } else {
    console.log('🎉 API Query Succeeded! Data:', data);
  }
}

run();
