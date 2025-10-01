-- URGENT FIX for RLS Policy Issues
-- This will fix the "new row violates row-level security policy" error

-- First, drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users on own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert access for users on own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for users on own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable upsert access for users on own profile" ON public.profiles;

-- Temporarily disable RLS to test
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Test if this fixes the issue by trying an insert
-- (You can test in your app after running this)

-- Once confirmed working, re-enable RLS with simpler policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create one simple policy that allows everything for the user's own records
CREATE POLICY "profiles_policy_all" ON public.profiles
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Alternative: If auth.uid() is not working, create a more permissive policy temporarily
-- Uncomment these lines if the above still doesn't work:

/*
DROP POLICY IF EXISTS "profiles_policy_all" ON public.profiles;

-- Temporarily allow all operations (ONLY for testing - remove later)
CREATE POLICY "profiles_policy_permissive" ON public.profiles
  FOR ALL USING (true)
  WITH CHECK (true);
*/

-- Check current user ID for debugging
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role,
  current_user as postgres_user;

-- Check if there are any profiles in the table
SELECT user_id, first_name, last_name, email, created_at 
FROM public.profiles 
LIMIT 5;
