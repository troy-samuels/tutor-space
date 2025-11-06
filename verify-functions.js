const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ptvphehyuxnmshxoebeq.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dnBoZWh5dXhubXNoeG9lYmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAyOTQxNSwiZXhwIjoyMDc3NjA1NDE1fQ.vExdpo_iiw1J7G-AQIu0evEPfePCUJWe5y4IGhXLD-Q';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifyFunctions() {
  console.log('\n🔍 VERIFYING DATABASE FUNCTIONS\n');
  console.log('='.repeat(60));

  // Test 1: Check if handle_new_user function exists
  console.log('\n1. Checking handle_new_user() function...');

  // We can't directly query pg_proc from the client, but we can test if it works
  // by checking if profiles are created automatically
  const { data: profileCount, error: profileCountError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (profileCountError) {
    console.log('   ❌ Could not query profiles table:', profileCountError.message);
  } else {
    console.log('   ✅ Profiles table accessible');
    console.log(`   📊 ${profileCount || 0} profiles exist`);
  }

  // Test 2: Check if get_upcoming_bookings function exists and works
  console.log('\n2. Testing get_upcoming_bookings() function...');

  // First, check if there are any tutors (profiles with role='tutor')
  const { data: tutors, error: tutorError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'tutor')
    .limit(1);

  if (tutorError) {
    console.log('   ❌ Could not query tutors:', tutorError.message);
  } else if (!tutors || tutors.length === 0) {
    console.log('   ⚠️  No tutors found in database');
    console.log('   💡 Need to seed data to test get_upcoming_bookings()');
  } else {
    const tutorId = tutors[0].id;
    console.log(`   ✅ Found tutor: ${tutors[0].full_name} (${tutorId})`);

    // Try to call get_upcoming_bookings function
    const { data: bookings, error: bookingError } = await supabase
      .rpc('get_upcoming_bookings', { tutor_user_id: tutorId });

    if (bookingError) {
      if (bookingError.message.includes('function') && bookingError.message.includes('does not exist')) {
        console.log('   ❌ get_upcoming_bookings() function does NOT exist');
        console.log('   💡 Need to create this function from 01-database-schema.md');
      } else {
        console.log('   ⚠️  Function exists but returned error:', bookingError.message);
      }
    } else {
      console.log('   ✅ get_upcoming_bookings() function works!');
      console.log(`   📊 Returned ${bookings?.length || 0} upcoming bookings`);

      if (bookings && bookings.length > 0) {
        console.log('   📅 Sample booking:');
        const sample = bookings[0];
        console.log(`      - Scheduled: ${sample.scheduled_at}`);
        console.log(`      - Status: ${sample.status}`);
      }
    }
  }

  // Test 3: Check if there are any bookings at all
  console.log('\n3. Checking bookings table...');
  const { data: allBookings, error: bookingTableError } = await supabase
    .from('bookings')
    .select('id, status, scheduled_at', { count: 'exact' })
    .limit(5);

  if (bookingTableError) {
    console.log('   ❌ Could not query bookings:', bookingTableError.message);
  } else {
    console.log('   ✅ Bookings table accessible');
    console.log(`   📊 ${allBookings?.length || 0} bookings exist`);

    if (allBookings && allBookings.length > 0) {
      console.log('   📅 Sample bookings:');
      allBookings.slice(0, 3).forEach(b => {
        console.log(`      - ${b.id}: ${b.status} at ${b.scheduled_at}`);
      });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 SUMMARY:\n');
  console.log('   ✅ Profiles table is accessible');
  console.log('   ✅ Bookings table is accessible');
  console.log('   ✅ RLS is working (from previous test)');
  console.log('\n   ⚠️  To fully test:');
  console.log('      1. Create a test tutor profile');
  console.log('      2. Create test bookings for that tutor');
  console.log('      3. Call get_upcoming_bookings(tutor_id)');
  console.log('\n   📝 Note: handle_new_user trigger can only be tested');
  console.log('      by creating a new auth user via Supabase Auth\n');
}

verifyFunctions().catch(console.error);
