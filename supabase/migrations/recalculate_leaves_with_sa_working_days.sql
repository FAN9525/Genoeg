-- Recalculate existing leaves to use SA working days
-- This ensures public holidays are not counted against leave

-- ============================================================================
-- Create function to recalculate all leave total_days
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_all_leave_days()
RETURNS TABLE(
  leave_id UUID,
  old_total_days INTEGER,
  new_total_days INTEGER,
  difference INTEGER
) AS $$
BEGIN
  RETURN QUERY
  UPDATE leaves l
  SET total_days = CASE 
    WHEN l.is_half_day = true THEN 0.5::NUMERIC
    ELSE calculate_sa_working_days(l.start_date, l.end_date)
  END
  WHERE l.is_half_day = false OR l.is_half_day IS NULL
  RETURNING 
    l.id as leave_id,
    l.total_days as old_total_days,
    calculate_sa_working_days(l.start_date, l.end_date) as new_total_days,
    (l.total_days - calculate_sa_working_days(l.start_date, l.end_date)) as difference;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Run the recalculation for existing leaves
-- ============================================================================

-- Execute the recalculation
SELECT * FROM recalculate_all_leave_days();

-- ============================================================================
-- Add comment
-- ============================================================================

COMMENT ON FUNCTION recalculate_all_leave_days IS 
  'Recalculates total_days for all leaves using SA working days calculation.
   This ensures public holidays are not counted against leave taken.
   Public holidays (Dec 25, 26, Jan 1, etc.) are excluded from leave days.';

