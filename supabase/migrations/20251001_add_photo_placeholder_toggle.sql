-- Add photo placeholder toggle to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS include_photo_placeholder BOOLEAN DEFAULT false;

-- Update existing profiles to have the toggle off by default
UPDATE public.profiles SET include_photo_placeholder = false WHERE include_photo_placeholder IS NULL;
