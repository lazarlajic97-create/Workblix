-- Create function to increment scan count
CREATE OR REPLACE FUNCTION increment_scan_count(p_user_id UUID, p_month_start DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.usage_scans (user_id, month_start, scans_count)
  VALUES (p_user_id, p_month_start, 1)
  ON CONFLICT (user_id, month_start)
  DO UPDATE SET 
    scans_count = usage_scans.scans_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;