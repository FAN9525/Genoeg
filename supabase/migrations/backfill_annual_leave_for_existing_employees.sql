-- Backfill annual leave for existing employees based on their employment start date
-- Calculate proper accrual for each employee

-- ============================================================================
-- Backfill annual leave accrual for 2025
-- ============================================================================

DO $$
DECLARE
  employee RECORD;
  annual_leave_type_id UUID;
  months_in_2025 INTEGER;
  accrued_amount NUMERIC;
  current_year INTEGER := 2025;
BEGIN
  -- Get Annual Leave type ID
  SELECT id INTO annual_leave_type_id
  FROM leave_types
  WHERE name = 'Annual Leave';
  
  -- For each employee with 0 annual leave in 2025
  FOR employee IN 
    SELECT 
      p.id as user_id,
      p.full_name,
      p.start_work_date,
      p.end_work_date
    FROM profiles p
    WHERE p.end_work_date IS NULL OR p.end_work_date >= CURRENT_DATE
  LOOP
    -- Calculate months worked in 2025
    IF employee.start_work_date < '2025-01-01'::DATE THEN
      -- Started before 2025, give full year accrual (11 months so far in 2025)
      months_in_2025 := 11; -- Jan through Nov
    ELSE
      -- Started during 2025, calculate months from start date
      months_in_2025 := 11 - EXTRACT(MONTH FROM employee.start_work_date)::INTEGER + 1;
    END IF;
    
    -- Calculate accrued days (1.75 per month, max 21)
    accrued_amount := LEAST(months_in_2025 * 1.75, 21);
    
    -- Update the annual leave balance
    UPDATE leave_balances
    SET 
      total_days = accrued_amount,
      accrued_days = accrued_amount,
      remaining_days = accrued_amount - used_days,
      updated_at = NOW()
    WHERE user_id = employee.user_id
      AND leave_type_id = annual_leave_type_id
      AND year = current_year
      AND accrued_days = 0;  -- Only update if currently at 0
      
    RAISE NOTICE 'Updated % - Accrued: % days (% months)', 
                 employee.full_name, accrued_amount, months_in_2025;
  END LOOP;
END;
$$;

-- ============================================================================
-- Add comment
-- ============================================================================

COMMENT ON FUNCTION run_monthly_annual_leave_accrual IS 
  'Monthly cron job function that accrues 1.75 days of annual leave 
   to all active employees. Runs on the 1st of each month.
   Caps at maximum 21 days per year.
   This backfill ensures existing employees have correct accrual for 2025.';

