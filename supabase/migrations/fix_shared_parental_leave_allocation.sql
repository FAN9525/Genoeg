-- Fix Shared Parental Leave Allocation Issue
-- Shared Parental Leave should be "per event" not automatically allocated to all users

-- ============================================================================
-- STEP 1: Add a flag to leave_types to indicate "per event" leave types
-- ============================================================================

-- Add column to mark leave types that should NOT be auto-allocated
ALTER TABLE leave_types 
ADD COLUMN IF NOT EXISTS auto_allocate BOOLEAN DEFAULT true;

-- ============================================================================
-- STEP 2: Mark Shared Parental Leave as NOT auto-allocate
-- ============================================================================

UPDATE leave_types
SET auto_allocate = false
WHERE name = 'Shared Parental Leave';

-- ============================================================================
-- STEP 3: Update create_initial_leave_balances function to respect auto_allocate
-- ============================================================================

CREATE OR REPLACE FUNCTION create_initial_leave_balances()
RETURNS TRIGGER AS $$
DECLARE
  leave_type RECORD;
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  -- Create a leave balance ONLY for auto-allocate leave types
  FOR leave_type IN 
    SELECT * FROM leave_types 
    WHERE auto_allocate = true OR auto_allocate IS NULL
  LOOP
    INSERT INTO leave_balances (user_id, leave_type_id, year, total_days, used_days, remaining_days)
    VALUES (NEW.id, leave_type.id, current_year, leave_type.max_days_per_year, 0, leave_type.max_days_per_year);
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Remove Shared Parental Leave balances from existing users
-- ============================================================================

-- Delete all Shared Parental Leave balances where used_days = 0
-- (Keep balances if someone actually used Shared Parental Leave)
DELETE FROM leave_balances
WHERE leave_type_id IN (
  SELECT id FROM leave_types WHERE name = 'Shared Parental Leave'
)
AND used_days = 0;

-- ============================================================================
-- STEP 5: Create a function to manually allocate Shared Parental Leave
-- ============================================================================

-- Function for admins to allocate Shared Parental Leave when needed
CREATE OR REPLACE FUNCTION allocate_shared_parental_leave(
  p_user_id UUID,
  p_days INTEGER DEFAULT 130,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS void AS $$
DECLARE
  v_leave_type_id UUID;
BEGIN
  -- Get Shared Parental Leave type ID
  SELECT id INTO v_leave_type_id
  FROM leave_types
  WHERE name = 'Shared Parental Leave';
  
  IF v_leave_type_id IS NULL THEN
    RAISE EXCEPTION 'Shared Parental Leave type not found';
  END IF;
  
  -- Insert or update the balance
  INSERT INTO leave_balances (user_id, leave_type_id, year, total_days, used_days, remaining_days)
  VALUES (p_user_id, v_leave_type_id, p_year, p_days, 0, p_days)
  ON CONFLICT (user_id, leave_type_id, year)
  DO UPDATE SET
    total_days = EXCLUDED.total_days,
    remaining_days = leave_balances.remaining_days + (EXCLUDED.total_days - leave_balances.total_days),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN leave_types.auto_allocate IS 
  'If true, this leave type is automatically allocated to new users. 
   If false, it must be manually allocated (e.g., Shared Parental Leave).';

COMMENT ON FUNCTION allocate_shared_parental_leave IS 
  'Manually allocate Shared Parental Leave to a specific user. 
   Should only be used when an employee has a qualifying parenting event.
   Usage: SELECT allocate_shared_parental_leave(''user_id_here'', 130, 2025);';


