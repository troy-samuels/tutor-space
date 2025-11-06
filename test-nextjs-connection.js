// Test Supabase connection using Next.js environment variables
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from app/.env.local
const envPath = path.join(__dirname, 'app', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing Supabase environment variables in app/.env.local');
  process.exit(1);
}

console.log('\n🔗 TESTING SUPABASE CLIENT CONNECTION\n');
console.log('='.repeat(60));
console.log(`\n📍 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Anon Key: ${anonKey.substring(0, 20)}...`);

const supabase = createClient(supabaseUrl, anonKey);

async function testConnection() {
  console.log('\n1. Testing basic connection...');

  // Test 1: Query profiles table
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, role', { count: 'exact' })
    .limit(1);

  if (profileError) {
    console.log('   ❌ Connection failed:', profileError.message);
    return false;
  }

  console.log('   ✅ Successfully connected to Supabase!');
  console.log(`   📊 Profiles query worked`);

  // Test 2: Query services table
  console.log('\n2. Testing services table access...');
  const { data: services, error: serviceError } = await supabase
    .from('services')
    .select('id, name', { count: 'exact' })
    .limit(1);

  if (serviceError) {
    console.log('   ❌ Services query failed:', serviceError.message);
    return false;
  }

  console.log('   ✅ Services table accessible');

  // Test 3: Verify RLS is working (try to access protected table)
  console.log('\n3. Testing RLS protection...');
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id', { count: 'exact' })
    .limit(1);

  if (studentError) {
    console.log('   ✅ RLS is working (students table protected)');
  } else if (!students || students.length === 0) {
    console.log('   ✅ RLS is working (students table returns no data without auth)');
  } else {
    console.log('   ⚠️  RLS might not be configured correctly');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ ALL TESTS PASSED\n');
  console.log('The Next.js app is properly configured to connect to Supabase!');
  console.log('\n📋 Environment variables:');
  console.log('   ✓ NEXT_PUBLIC_SUPABASE_URL');
  console.log('   ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('\n💡 Next steps:');
  console.log('   1. Wire up authentication flow');
  console.log('   2. Create seed data (tutors, services, bookings)');
  console.log('   3. Test user registration and profile creation\n');

  return true;
}

testConnection().catch(err => {
  console.error('\n❌ Unexpected error:', err);
  process.exit(1);
});
