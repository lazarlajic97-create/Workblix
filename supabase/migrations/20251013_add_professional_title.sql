-- Add professional_title column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS professional_title TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.professional_title IS 'Professional title or job position of the user';