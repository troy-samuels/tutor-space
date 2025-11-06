// Temporary script to verify database schema
// Run with: node verify-schema.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ptvphehyuxnmshxoebeq.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dnBoZWh5dXhubXNoeG9lYmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAyOTQxNSwiZXhwIjoyMDc3NjA1NDE1fQ.vExdpo_iiw1J7G-AQIu0evEPfePCUJWe5y4IGhXLD-Q';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Expected tables from the schema document
const expectedTables = [
  'profiles',
  'services',
  'students',
  'bookings',
  'lesson_notes',
  'availability',
  'calendar_connections',
  'links',
  'subscriptions',
  'session_package_templates',
  'session_package_purchases',
  'session_package_redemptions',
  'invoices',
  'invoice_line_items',
  'payment_reminders',
  'review_requests',
  'reviews',
  'resources',
  'resource_tags',
  'resource_tag_map',
  'lesson_plans',
  'lesson_plan_resources',
  'interactive_activities',
  'lead_sources',
  'leads',
  'lead_events',
  'ad_accounts',
  'ad_campaigns',
  'ad_creatives',
  'ad_performance_daily',
  'ai_transcripts',
  'ai_transcript_segments',
  'ai_detected_errors',
  'ai_content_clips',
  'group_sessions',
  'group_session_attendees',
  'marketplace_resources',
  'marketplace_orders',
  'executive_snapshots'
];

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');

  const existingTables = [];
  const missingTables = [];

  // Check each table individually
  for (const tableName of expectedTables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          missingTables.push(tableName);
        } else {
          existingTables.push(tableName);
        }
      } else {
        existingTables.push(tableName);
      }
    } catch (e) {
      missingTables.push(tableName);
    }
  }

  printResults(existingTables, missingTables);
}

function printResults(existing, missing) {
  console.log('✅ EXISTING TABLES (' + existing.length + '/' + expectedTables.length + '):\n');
  existing.sort().forEach(table => {
    console.log('  ✓ ' + table);
  });

  if (missing.length > 0) {
    console.log('\n❌ MISSING TABLES (' + missing.length + '):\n');
    missing.sort().forEach(table => {
      console.log('  ✗ ' + table);
    });

    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Open Supabase Dashboard: https://supabase.com/dashboard/project/ptvphehyuxnmshxoebeq');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Run the SQL for missing tables from 01-database-schema.md');
    console.log('   4. Run this script again to verify\n');
  } else {
    console.log('\n🎉 All tables exist! Now checking RLS and policies...\n');
    checkRLSAndPolicies();
  }
}

async function checkRLSAndPolicies() {
  console.log('🔒 Checking Row Level Security...\n');

  // This would require additional queries to pg_policies
  console.log('⚠️  Manual check required:');
  console.log('   1. Verify RLS is enabled on all tables');
  console.log('   2. Verify policies exist for each table');
  console.log('   3. Verify triggers are set up (updated_at, handle_new_user)');
  console.log('   4. Verify indexes exist for performance');
  console.log('\nRun this in Supabase SQL Editor to check RLS:');
  console.log('   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = \'public\';');
  console.log('\nRun this to check policies:');
  console.log('   SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = \'public\';');
}

checkSchema();
