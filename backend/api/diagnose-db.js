import pg from 'pg';

const connectionString = 'postgresql://postgres.ilshthmfnllsrynjdxeh:fr70zpsONQYiw4hR@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('⏳ Connecting to database...');
  try {
    await client.connect();
    console.log('🎉 Connected!');
    await client.end();
  } catch (err) {
    console.error('\n❌ Connection Error:');
    console.error(err);
    console.error('\nError Details:', JSON.stringify(err, null, 2));
  }
}

run();
