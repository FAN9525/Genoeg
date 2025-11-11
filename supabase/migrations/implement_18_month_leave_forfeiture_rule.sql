-- Implement 18-month leave forfeiture rule (BCEA compliance)
-- Unused annual leave must be used within 18 months or it's forfeited
-- Based on: Ludick v Rural Maintenance case law

-- ============================================================================
-- Add forfeiture tracking fields to leave_balances
-- ============================================================================

-- Add columns to track forfeiture
ALTER TABLE leave_balances
ADD COLUMN IF NOT EXISTS carried_over_from_previous_year NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS forfeiture_due_date DATE,
ADD COLUMN IF NOT EXISTS last_forfeiture_acknowledgment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS forfeited_days NUMERIC DEFAULT 0;

-- Add forfeiture acknowledgment to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_leave_forfeiture_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS forfeiture_acknowledgment_required BOOLEAN DEFAULT false;

-- ============================================================================
-- Create function to calculate which leave is subject to forfeiture
-- ============================================================================

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

COMMENT ON FUNCTION calculate_leave_subject_to_forfeiture IS 
  'Calculates which annual leave days are subject to forfeiture under the 18-month rule.
   BCEA allows 12-month cycle + 6-month carry-over = 18 months total.
   Based on Ludick v Rural Maintenance case law.';

-- ============================================================================
-- Create function to process leave forfeiture with user acknowledgment
-- ============================================================================

CREATE OR REPLACE FUNCTION process_leave_forfeiture(
  p_user_id UUID,
  p_acknowledgment_confirmed BOOLEAN DEFAULT false
)
RETURNS TABLE(
  year INTEGER,
  days_forfeited NUMERIC,
  reason TEXT,
  requires_acknowledgment BOOLEAN
) AS $$
DECLARE
  total_forfeited NUMERIC := 0;
  forfeit_record RECORD;
BEGIN
  -- First, check what would be forfeited
  FOR forfeit_record IN 
    SELECT * FROM calculate_leave_subject_to_forfeiture(p_user_id)
    WHERE days_subject_to_forfeiture > 0
  LOOP
    total_forfeited := total_forfeited + forfeit_record.days_subject_to_forfeiture;
  END LOOP;
  
  -- If there's nothing to forfeit, return early
  IF total_forfeited = 0 THEN
    RETURN QUERY
    SELECT 
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      0::NUMERIC,
      'No leave subject to forfeiture'::TEXT,
      false;
    RETURN;
  END IF;
  
  -- If user hasn't acknowledged, return what needs acknowledgment
  IF NOT p_acknowledgment_confirmed THEN
    RETURN QUERY
    SELECT 
      calf.year,
      calf.days_subject_to_forfeiture,
      calf.forfeiture_reason,
      true as requires_acknowledgment
    FROM calculate_leave_subject_to_forfeiture(p_user_id) calf
    WHERE calf.days_subject_to_forfeiture > 0;
    
    -- Mark profile as requiring acknowledgment
    UPDATE profiles
    SET forfeiture_acknowledgment_required = true
    WHERE id = p_user_id;
    
    RETURN;
  END IF;
  
  -- User has acknowledged, process forfeiture
  RETURN QUERY
  WITH forfeited_balances AS (
    UPDATE leave_balances lb
    SET 
      forfeited_days = COALESCE(lb.forfeited_days, 0) + calf.days_subject_to_forfeiture,
      remaining_days = lb.remaining_days - calf.days_subject_to_forfeiture::INTEGER,
      last_forfeiture_acknowledgment_date = NOW(),
      updated_at = NOW()
    FROM calculate_leave_subject_to_forfeiture(p_user_id) calf
    WHERE lb.id = calf.leave_balance_id
      AND calf.days_subject_to_forfeiture > 0
    RETURNING 
      lb.year,
      calf.days_subject_to_forfeiture,
      calf.forfeiture_reason
  )
  SELECT 
    fb.year,
    fb.days_subject_to_forfeiture as days_forfeited,
    fb.forfeiture_reason as reason,
    false as requires_acknowledgment
  FROM forfeited_balances fb;
  
  -- Update profile
  UPDATE profiles
  SET 
    last_leave_forfeiture_date = NOW(),
    forfeiture_acknowledgment_required = false
  WHERE id = p_user_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_leave_forfeiture IS 
  'Processes leave forfeiture for a user.
   If p_acknowledgment_confirmed = false, returns what would be forfeited.
   If p_acknowledgment_confirmed = true, processes the forfeiture.
   User must acknowledge before forfeiture is applied.';

-- ============================================================================
-- Update leave balances to set cycle dates for annual leave
-- ============================================================================

-- Set cycle dates for existing annual leave balances
UPDATE leave_balances lb
SET 
  cycle_start_date = CASE 
    WHEN cycle_start_date IS NULL THEN DATE(lb.year || '-01-01')
    ELSE cycle_start_date
  END,
  cycle_end_date = CASE 
    WHEN cycle_end_date IS NULL THEN DATE(lb.year || '-12-31')
    ELSE cycle_end_date
  END,
  forfeiture_due_date = CASE 
    WHEN forfeiture_due_date IS NULL THEN DATE(lb.year || '-12-31') + INTERVAL '6 months'
    ELSE forfeiture_due_date
  END
FROM leave_types lt
WHERE lb.leave_type_id = lt.id
  AND lt.name = 'Annual Leave'
  AND (lb.cycle_start_date IS NULL OR lb.cycle_end_date IS NULL OR lb.forfeiture_due_date IS NULL);

-- ============================================================================
-- Create view for employees with forfeiture pending
-- ============================================================================

CREATE OR REPLACE VIEW employees_with_pending_forfeiture AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.email,
  p.forfeiture_acknowledgment_required,
  p.last_leave_forfeiture_date,
  calf.year,
  calf.days_subject_to_forfeiture,
  calf.forfeiture_reason,
  calf.forfeiture_due_date
FROM profiles p
CROSS JOIN LATERAL calculate_leave_subject_to_forfeiture(p.id) calf
WHERE calf.days_subject_to_forfeiture > 0
ORDER BY p.full_name, calf.year;

COMMENT ON VIEW employees_with_pending_forfeiture IS 
  'Shows all employees who have leave subject to forfeiture under the 18-month rule.
   Used to notify employees and track acknowledgments.';

-- ============================================================================
-- Add comments to new columns
-- ============================================================================

COMMENT ON COLUMN leave_balances.carried_over_from_previous_year IS 
  'Days carried over from previous year (max 6 months to use)';

COMMENT ON COLUMN leave_balances.forfeiture_due_date IS 
  'Date when unused leave will be forfeited (18 months from start of cycle)';

COMMENT ON COLUMN leave_balances.last_forfeiture_acknowledgment_date IS 
  'When user last acknowledged and processed forfeiture';

COMMENT ON COLUMN leave_balances.forfeited_days IS 
  'Total days forfeited due to 18-month rule';

COMMENT ON COLUMN profiles.last_leave_forfeiture_date IS 
  'Last time user processed leave forfeiture';

COMMENT ON COLUMN profiles.forfeiture_acknowledgment_required IS 
  'Flag indicating user needs to acknowledge pending forfeiture';

