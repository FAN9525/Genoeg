-- Fix schema path issue in create_initial_leave_balances
-- Use fully qualified table names to avoid search_path issues

CREATE OR REPLACE FUNCTION create_initial_leave_balances()
RETURNS TRIGGER AS $$
DECLARE
  leave_type RECORD;
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  allocated_days INTEGER;
BEGIN
  -- Create a leave balance ONLY for auto-allocate leave types
  -- Use fully qualified table name: public.leave_types
  FOR leave_type IN 
    SELECT * FROM public.leave_types 
    WHERE auto_allocate = true OR auto_allocate IS NULL
  LOOP
    -- Annual leave starts at 0 (will be accrued monthly via cron job)
    IF leave_type.name = 'Annual Leave' THEN
      allocated_days := 0;
    ELSE
      -- For other leave types, allocate full amount
      allocated_days := leave_type.max_days_per_year;
    END IF;
    
    -- Insert the balance (fully qualified table name)
    INSERT INTO public.leave_balances (
      user_id, 
      leave_type_id, 
      year, 
      total_days, 
      used_days, 
      remaining_days,
      accrued_days
    )
    VALUES (
      NEW.id, 
      leave_type.id, 
      current_year, 
      allocated_days, 
      0, 
      allocated_days,
      CASE WHEN leave_type.name = 'Annual Leave' THEN 0 ELSE NULL END
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public';  -- Explicitly set search path

COMMENT ON FUNCTION create_initial_leave_balances IS 
  'Automatically creates initial leave balances for new users.
   Annual leave starts at 0 and accrues monthly via cron job (1.75 days/month).
   Other leave types receive full allocation immediately.
   Uses fully qualified table names to avoid search_path issues.';

