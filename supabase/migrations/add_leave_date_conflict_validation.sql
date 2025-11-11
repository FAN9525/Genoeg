-- Add validation to prevent double bookings of leave dates
-- Users cannot book leave on dates that already have approved or pending leave

-- ============================================================================
-- Create function to check for date conflicts
-- ============================================================================

CREATE OR REPLACE FUNCTION check_leave_date_conflict(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_exclude_leave_id UUID DEFAULT NULL
)
RETURNS TABLE(
  has_conflict BOOLEAN,
  conflict_message TEXT,
  conflicting_leave_id UUID
) AS $$
DECLARE
  v_conflict RECORD;
BEGIN
  -- Find any approved or pending leaves that overlap with the requested dates
  SELECT 
    l.id,
    l.start_date,
    l.end_date,
    l.status,
    lt.name as leave_type_name
  INTO v_conflict
  FROM leaves l
  JOIN leave_types lt ON l.leave_type_id = lt.id
  WHERE l.user_id = p_user_id
    AND l.status IN ('approved', 'pending')
    AND (l.id != p_exclude_leave_id OR p_exclude_leave_id IS NULL)
    AND (
      -- Check if dates overlap
      (p_start_date >= l.start_date AND p_start_date <= l.end_date) OR
      (p_end_date >= l.start_date AND p_end_date <= l.end_date) OR
      (p_start_date <= l.start_date AND p_end_date >= l.end_date)
    )
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT 
      true,
      'Date conflict: These dates overlap with your ' || v_conflict.leave_type_name || 
      ' (' || v_conflict.start_date || ' to ' || v_conflict.end_date || ') which is ' || 
      v_conflict.status || '. Please choose different dates.',
      v_conflict.id;
  ELSE
    RETURN QUERY SELECT 
      false,
      'No date conflicts found',
      NULL::UUID;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_leave_date_conflict IS 
  'Checks if a leave request conflicts with existing approved or pending leaves.
   Prevents double bookings on the same dates.
   Returns conflict status, message, and conflicting leave ID if found.';

-- ============================================================================
-- Create trigger to prevent double bookings on INSERT
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_leave_date_conflicts()
RETURNS TRIGGER AS $$
DECLARE
  v_conflict RECORD;
BEGIN
  -- Check for conflicts when inserting a new leave
  SELECT * INTO v_conflict
  FROM check_leave_date_conflict(NEW.user_id, NEW.start_date, NEW.end_date);
  
  IF v_conflict.has_conflict THEN
    RAISE EXCEPTION '%', v_conflict.conflict_message;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS check_leave_conflicts_on_insert ON leaves;

-- Create trigger
CREATE TRIGGER check_leave_conflicts_on_insert
  BEFORE INSERT ON leaves
  FOR EACH ROW
  EXECUTE FUNCTION prevent_leave_date_conflicts();

COMMENT ON TRIGGER check_leave_conflicts_on_insert ON leaves IS 
  'Prevents insertion of leave requests that conflict with existing approved or pending leaves.';

-- ============================================================================
-- Create trigger to prevent double bookings on UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_leave_date_conflicts_update()
RETURNS TRIGGER AS $$
DECLARE
  v_conflict RECORD;
BEGIN
  -- Only check if dates are being changed
  IF NEW.start_date != OLD.start_date OR NEW.end_date != OLD.end_date THEN
    -- Check for conflicts, excluding the current leave being updated
    SELECT * INTO v_conflict
    FROM check_leave_date_conflict(NEW.user_id, NEW.start_date, NEW.end_date, NEW.id);
    
    IF v_conflict.has_conflict THEN
      RAISE EXCEPTION '%', v_conflict.conflict_message;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS check_leave_conflicts_on_update ON leaves;

-- Create trigger
CREATE TRIGGER check_leave_conflicts_on_update
  BEFORE UPDATE ON leaves
  FOR EACH ROW
  EXECUTE FUNCTION prevent_leave_date_conflicts_update();

COMMENT ON TRIGGER check_leave_conflicts_on_update ON leaves IS 
  'Prevents updating leave dates to conflict with existing approved or pending leaves.';

