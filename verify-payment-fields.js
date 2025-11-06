const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ptvphehyuxnmshxoebeq.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dnBoZWh5dXhubXNoeG9lYmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAyOTQxNSwiZXhwIjoyMDc3NjA1NDE1fQ.vExdpo_iiw1J7G-AQIu0evEPfePCUJWe5y4IGhXLD-Q';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifyPaymentFields() {
  console.log('\n🔍 Verifying payment instruction fields...\n');

  // Try to query a profile with the new fields
  const { data, error } = await supabase
    .from('profiles')
    .select('id, payment_instructions, venmo_handle, paypal_email, zelle_phone, stripe_payment_link, custom_payment_url')
    .limit(1);

  if (error) {
    console.log('❌ Error querying payment fields:', error.message);
    console.log('\nThe migration may not have been applied successfully.');
    return false;
  }

  console.log('✅ Payment instruction fields exist!\n');
  console.log('Fields verified:');
  console.log('  • payment_instructions');
  console.log('  • venmo_handle');
  console.log('  • paypal_email');
  console.log('  • zelle_phone');
  console.log('  • stripe_payment_link');
  console.log('  • custom_payment_url\n');

  return true;
}

verifyPaymentFields()
  .then(success => {
    if (success) {
      console.log('✅ Migration successful! Ready to build payment settings page.\n');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
