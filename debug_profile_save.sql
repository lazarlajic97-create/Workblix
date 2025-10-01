-- Debug Profile Save Issues
-- Run this in Supabase SQL Editor to check the database setup

-- 1. Check if profiles table exists and its structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check RLS policies on profiles table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Check if RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles' 
  AND schemaname = 'public';

-- 4. Test basic insert (this will show if RLS is working)
-- This should work if you're authenticated as a user
-- UNCOMMENT THE LINES BELOW TO TEST (replace 'your-user-id' with actual user ID)

/*
INSERT INTO profiles (user_id, first_name, last_name, email) 
VALUES ('your-user-id', 'Test', 'User', 'test@example.com')
ON CONFLICT (user_id) DO UPDATE SET 
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email;
*/

-- 5. Check auth.users table to see if your user exists
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
LIMIT 5;
