-- Switch to pure monthly accrual for annual leave
-- Employees start with 0 annual leave and accrue 1.75 days per month via cron job

-- ============================================================================
-- Update create_initial_leave_balances to give 0 annual leave initially
-- ============================================================================

CREATE OR REPLACE FUNCTION create_initial_leave_balances()
RETURNS TRIGGER AS $$
DECLARE
  leave_type RECORD;
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  allocated_days INTEGER;
BEGIN
  -- Create a leave balance ONLY for auto-allocate leave types
  FOR leave_type IN 
    SELECT * FROM leave_types 
    WHERE auto_allocate = true OR auto_allocate IS NULL
  LOOP
    -- Annual leave starts at 0 (will be accrued monthly via cron job)
    IF leave_type.name = 'Annual Leave' THEN
      allocated_days := 0;
    ELSE
      -- For other leave types, allocate full amount
      allocated_days := leave_type.max_days_per_year;
    END IF;
    
    -- Insert the balance
    INSERT INTO leave_balances (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_initial_leave_balances IS 
  'Automatically creates initial leave balances for new users.
   Annual leave starts at 0 and accrues monthly via cron job (1.75 days/month).
   Other leave types receive full allocation immediately.';

-- ============================================================================
-- Recalculate Elma's 2017 allocation using monthly accrual
-- ============================================================================

DO $$
DECLARE
  elma_user_id UUID;
  annual_leave_type_id UUID;
  months_worked DECIMAL;
  calculated_accrual DECIMAL;
BEGIN
  -- Get Elma's user ID
  SELECT id INTO elma_user_id
  FROM profiles
  WHERE email = 'elma@adminfocus.co.za';
  
  -- Get Annual Leave type ID
  SELECT id INTO annual_leave_type_id
  FROM leave_types
  WHERE name = 'Annual Leave';
  
  -- Calculate months worked from June 19 to Dec 31, 2017
  -- Using 30.44 days per month average
  months_worked := (DATE '2017-12-31' - DATE '2017-06-19')::NUMERIC / 30.44;
  
  -- Calculate accrued days: months × 1.75 days/month
  calculated_accrual := ROUND(months_worked * 1.75, 2);
  
  -- Update 2017 allocation with monthly accrual calculation
  -- 6.41 months × 1.75 = 11.21 days
  IF elma_user_id IS NOT NULL AND annual_leave_type_id IS NOT NULL THEN
    UPDATE leave_balances
    SET 
      total_days = calculated_accrual::INTEGER,
      remaining_days = calculated_accrual::INTEGER - used_days,
      accrued_days = calculated_accrual,
      updated_at = NOW()
    WHERE user_id = elma_user_id
      AND leave_type_id = annual_leave_type_id
      AND year = 2017;
      
    RAISE NOTICE 'Updated Elma 2017: % months worked = % days accrued', 
                 ROUND(months_worked, 2), calculated_accrual;
  END IF;
END;
$$;

