-- Create monthly annual leave accrual function
-- This function runs on the 1st of each month via cron job

CREATE OR REPLACE FUNCTION run_monthly_annual_leave_accrual()
RETURNS TABLE(
  user_id UUID,
  user_name TEXT,
  previous_balance NUMERIC,
  accrued_amount NUMERIC,
  new_balance NUMERIC,
  year INTEGER
) AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  annual_leave_type_id UUID;
  accrual_per_month NUMERIC := 1.75;
  max_annual_days INTEGER := 21;
BEGIN
  -- Get Annual Leave type ID
  SELECT id INTO annual_leave_type_id
  FROM leave_types
  WHERE name = 'Annual Leave';
  
  IF annual_leave_type_id IS NULL THEN
    RAISE EXCEPTION 'Annual Leave type not found';
  END IF;
  
  -- Return results of the accrual process
  RETURN QUERY
  WITH active_employees AS (
    -- Get all active employees (no end date or end date in future)
    SELECT 
      p.id,
      p.full_name,
      p.start_work_date
    FROM profiles p
    WHERE p.end_work_date IS NULL 
       OR p.end_work_date >= CURRENT_DATE
  ),
  accrual_updates AS (
    -- Update each employee's annual leave balance
    UPDATE leave_balances lb
    SET 
      accrued_days = LEAST(
        COALESCE(lb.accrued_days, 0) + accrual_per_month,
        max_annual_days
      ),
      total_days = LEAST(
        COALESCE(lb.accrued_days, 0) + accrual_per_month,
        max_annual_days
      )::INTEGER,
      remaining_days = LEAST(
        COALESCE(lb.accrued_days, 0) + accrual_per_month,
        max_annual_days
      )::INTEGER - lb.used_days,
      updated_at = NOW()
    FROM active_employees ae
    WHERE lb.user_id = ae.id
      AND lb.leave_type_id = annual_leave_type_id
      AND lb.year = current_year
      AND COALESCE(lb.accrued_days, 0) < max_annual_days  -- Don't exceed max
    RETURNING 
      lb.user_id,
      ae.full_name,
      COALESCE(lb.accrued_days, 0) - accrual_per_month as prev_balance,
      accrual_per_month as accrual,
      COALESCE(lb.accrued_days, 0) as new_bal,
      lb.year
  )
  SELECT 
    au.user_id,
    au.full_name::TEXT,
    au.prev_balance,
    au.accrual,
    au.new_bal,
    au.year
  FROM accrual_updates au;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION run_monthly_annual_leave_accrual IS 
  'Monthly cron job function that accrues 1.75 days of annual leave 
   to all active employees. Runs on the 1st of each month.
   Caps at maximum 21 days per year.';

