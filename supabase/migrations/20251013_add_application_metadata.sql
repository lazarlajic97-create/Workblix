-- Add metadata fields to applications table for rich preview
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS applicant_info JSONB,
ADD COLUMN IF NOT EXISTS job_info JSONB,
ADD COLUMN IF NOT EXISTS date_generated TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.applications.applicant_info IS 'Applicant information (name, address, phone, email, city)';
COMMENT ON COLUMN public.applications.job_info IS 'Job information (jobtitel, arbeitgeber, ort)';
COMMENT ON COLUMN public.applications.date_generated IS 'Formatted date when application was generated';
