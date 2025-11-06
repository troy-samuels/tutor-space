-- Check RLS is enabled on all tables
SELECT 
  tablename, 
  CASE 
    WHEN rowsecurity THEN '✅ Enabled' 
    ELSE '❌ Disabled' 
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
