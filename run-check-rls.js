const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ptvphehyuxnmshxoebeq.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dnBoZWh5dXhubXNoeG9lYmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAyOTQxNSwiZXhwIjoyMDc3NjA1NDE1fQ.vExdpo_iiw1J7G-AQIu0evEPfePCUJWe5y4IGhXLD-Q';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkRLS() {
  console.log('🔒 Checking Row Level Security status...\n');

  const { data, error } = await supabase
    .rpc('sql', {
      query: `
        SELECT
          tablename,
          CASE
            WHEN rowsecurity THEN '✅ Enabled'
            ELSE '❌ Disabled'
          END as rls_status
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `
    })
    .single();

  if (error) {
    // RPC might not exist, try direct query via postgres
    const { data: tables, error: queryError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .order('tablename');

    if (queryError) {
      console.error('❌ Error checking RLS:', queryError.message);
      console.log('\n💡 Executing SQL directly via raw query...\n');

      // Try using the SQL from file
      const fs = require('fs');
      const sql = fs.readFileSync('check-rls.sql', 'utf8');
      console.log('Execute this SQL in Supabase SQL Editor:\n');
      console.log(sql);
      return;
    }

    // Format and display results
    console.log('RLS Status for all tables:\n');
    let enabledCount = 0;
    let disabledCount = 0;

    tables.forEach(table => {
      const status = table.rowsecurity ? '✅ Enabled' : '❌ Disabled';
      console.log(`  ${table.tablename.padEnd(35)} ${status}`);
      if (table.rowsecurity) enabledCount++;
      else disabledCount++;
    });

    console.log(`\n📊 Summary: ${enabledCount} enabled, ${disabledCount} disabled\n`);

    if (disabledCount > 0) {
      console.log('⚠️  Some tables have RLS disabled. Enable with:');
      console.log('   ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;\n');
    }

    return;
  }

  console.log(data);
}

checkRLS().catch(console.error);
