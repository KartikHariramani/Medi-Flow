import pg from 'pg';

const regions = [
  'us-east-1',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'sa-east-1'
];

const password = 'fr70zpsONQYiw4hR';
const projectRef = 'ilshthmfnllsrynjdxeh';

async function testRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const connectionString = `postgresql://postgres.${projectRef}:${password}@${host}:6543/postgres`;
  
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`\n🎉 SUCCESS! Connected to region: ${region}`);
    console.log(`Database Host: ${host}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ Failed region ${region}: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('⏳ Probing regional database poolers for project ilshthmfnllsrynjdxeh...\n');
  for (const region of regions) {
    const success = await testRegion(region);
    if (success) {
      process.exit(0);
    }
  }
  console.log('\n❌ None of the tested regions could connect. Please verify your project reference or database password.');
  process.exit(1);
}

run();
