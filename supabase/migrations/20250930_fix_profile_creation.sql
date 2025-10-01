-- Fix profile creation to include plan fields and ensure it works for all users

-- Update the handle_new_user function to include plan and plan_status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, plan, plan_status)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    'free',
    null
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    plan = COALESCE(profiles.plan, 'free'),
    plan_status = COALESCE(profiles.plan_status, null);
  
  RETURN NEW;
END;
$$;

-- Ensure RLS policies allow users to read their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" 
      ON public.profiles 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create profiles for existing users who don't have one
INSERT INTO public.profiles (user_id, email, first_name, last_name, plan, plan_status)
SELECT 
  id,
  email,
  raw_user_meta_data ->> 'first_name',
  raw_user_meta_data ->> 'last_name',
  'free',
  null
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;
