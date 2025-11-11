-- Fix type mismatch in forfeiture calculation function

CREATE OR REPLACE FUNCTION calculate_leave_subject_to_forfeiture(
  p_user_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  leave_balance_id UUID,
  year INTEGER,
  days_subject_to_forfeiture NUMERIC,
  forfeiture_reason TEXT,
  forfeiture_due_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lb.id as leave_balance_id,
    lb.year,
    -- Calculate days that are older than 18 months
    CASE 
      WHEN lb.cycle_end_date IS NOT NULL 
           AND (p_as_of_date - lb.cycle_end_date) > 180 -- 6 months after cycle end
      THEN lb.remaining_days::NUMERIC  -- Cast to NUMERIC to match return type
      ELSE 0::NUMERIC
    END as days_subject_to_forfeiture,
    CASE 
      WHEN lb.cycle_end_date IS NOT NULL 
           AND (p_as_of_date - lb.cycle_end_date) > 180
      THEN 'Leave from ' || lb.year || ' cycle has exceeded 18-month limit (cycle ended ' || 
           lb.cycle_end_date || ', forfeiture date was ' || 
           (lb.cycle_end_date + INTERVAL '6 months')::DATE || ')'
      ELSE 'Not subject to forfeiture'
    END as forfeiture_reason,
    CASE 
      WHEN lb.cycle_end_date IS NOT NULL
      THEN (lb.cycle_end_date + INTERVAL '6 months')::DATE
      ELSE NULL
    END as forfeiture_due_date
  FROM leave_balances lb
  JOIN leave_types lt ON lb.leave_type_id = lt.id
  WHERE lb.user_id = p_user_id
    AND lt.name = 'Annual Leave'
    AND lb.remaining_days > 0
  ORDER BY lb.year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

