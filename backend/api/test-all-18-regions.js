import pg from 'pg';
import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ca-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
  'eu-central-1', 'eu-north-1', 'ap-south-1', 'ap-southeast-1',
  'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
  'sa-east-1', 'me-central-1'
];

const password = 'fr70zpsONQYiw4hR';
const projectRef = 'ilshthmfnllsrynjdxeh';

async function testRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  
  // 1. Test DNS first
  try {
    await lookup(host);
  } catch (dnsErr) {
    // Hostname does not exist in DNS
    return false;
  }

  console.log(`📡 Regional pooler exists: ${host}`);

  // 2. Test PG connection
  const connectionString = `postgresql://postgres:${password}@${host}:6543/postgres?options=project%3D${projectRef}`;
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000
  });

  try {
    await client.connect();
    console.log(`\n🎉 SUCCESS! Connected to region: ${region}`);
    console.log(`Use this connection string in your .env:`);
    console.log(`DATABASE_URL=${connectionString}\n`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`   ❌ Connection failed: (${err.code || 'NO_CODE'}) ${err.message.trim()}`);
    return false;
  }
}

async function run() {
  console.log('⏳ Probing all 18 Supabase regions...\n');
  let found = false;
  for (const region of regions) {
    const success = await testRegion(region);
    if (success) {
      found = true;
      break;
    }
  }
  if (!found) {
    console.log('\n❌ None of the 18 regions could connect. Please verify your project reference or password.');
  }
}

run();
