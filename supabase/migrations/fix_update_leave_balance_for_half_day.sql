-- Fix update_leave_balance function to support half-day leaves (0.5 days)

-- Drop existing function (all versions)
DROP FUNCTION IF EXISTS update_leave_balance(UUID, UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS update_leave_balance(UUID, UUID, INTEGER, NUMERIC);

-- Recreate with NUMERIC parameter
CREATE OR REPLACE FUNCTION update_leave_balance(
  p_user_id UUID, 
  p_leave_type_id UUID, 
  p_year INTEGER, 
  p_days_used NUMERIC  -- Changed from INTEGER to NUMERIC to support 0.5
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the leave balance
  UPDATE leave_balances
  SET 
    used_days = used_days + p_days_used,
    remaining_days = remaining_days - p_days_used,
    updated_at = NOW()
  WHERE 
    user_id = p_user_id 
    AND leave_type_id = p_leave_type_id 
    AND year = p_year;
    
  -- If no balance exists, create one
  IF NOT FOUND THEN
    INSERT INTO leave_balances (
      user_id,
      leave_type_id,
      year,
      total_days,
      used_days,
      remaining_days
    )
    SELECT 
      p_user_id,
      lt.id,
      p_year,
      lt.max_days_per_year,
      p_days_used,
      lt.max_days_per_year - p_days_used
    FROM leave_types lt
    WHERE lt.id = p_leave_type_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION update_leave_balance IS 
  'Updates leave balance after leave approval.
   Supports decimal values for half-day leaves (0.5 days).
   Parameter p_days_used changed from INTEGER to NUMERIC to support half-day increments.';

