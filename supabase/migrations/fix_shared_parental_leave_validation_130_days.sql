-- Fix Shared Parental Leave validation to allow 130 days per event (not just 10)

CREATE OR REPLACE FUNCTION validate_sa_leave_request(
  p_user_id UUID,
  p_leave_type_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE(
  is_valid BOOLEAN,
  message TEXT,
  working_days INTEGER,
  requires_medical_cert BOOLEAN
) AS $$
DECLARE
  v_leave_type_name TEXT;
  v_user_start_date DATE;
  v_working_days INTEGER;
  v_months_employed INTEGER;
  v_work_days_per_week INTEGER;
  v_sick_leave_available NUMERIC;
  v_shared_parental_available NUMERIC;
  v_shared_parental_used NUMERIC;
  v_requires_cert BOOLEAN := false;
BEGIN
  -- Get leave type name
  SELECT name INTO v_leave_type_name
  FROM leave_types
  WHERE id = p_leave_type_id;

  -- Get user employment start date and work days per week
  SELECT start_work_date, work_days_per_week
  INTO v_user_start_date, v_work_days_per_week
  FROM profiles
  WHERE id = p_user_id;

  -- Calculate working days using the SA working days function
  SELECT * INTO v_working_days
  FROM calculate_sa_working_days(p_start_date, p_end_date);

  -- Validate that working days is at least 1
  IF v_working_days < 1 THEN
    RETURN QUERY SELECT false, 'Leave request must be for at least 1 working day'::TEXT, 0::INTEGER, false;
    RETURN;
  END IF;

  -- Calculate months employed
  v_months_employed := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_user_start_date)) * 12 +
                       EXTRACT(MONTH FROM AGE(CURRENT_DATE, v_user_start_date));

  -- Validate based on leave type
  CASE v_leave_type_name
    WHEN 'Annual Leave' THEN
      -- Annual leave is always valid if there's enough balance
      RETURN QUERY SELECT true, 'Valid annual leave request'::TEXT, v_working_days, false;

    WHEN 'Sick Leave' THEN
      -- Check if medical certificate is required
      IF v_working_days > 2 THEN
        v_requires_cert := true;
      END IF;

      -- Get current sick leave balance for the active cycle
      SELECT COALESCE(SUM(total_days - used_days), 0) INTO v_sick_leave_available
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.user_id = p_user_id
        AND lt.name = 'Sick Leave'
        AND lb.cycle_end_date >= CURRENT_DATE;

      IF v_sick_leave_available <= 0 THEN
        RETURN QUERY SELECT false, 'No sick leave balance available'::TEXT, v_working_days, v_requires_cert;
      ELSE
        RETURN QUERY SELECT true, 'Valid sick leave request'::TEXT, v_working_days, v_requires_cert;
      END IF;

    WHEN 'Family Responsibility Leave' THEN
      -- Must have worked 4+ months
      IF v_months_employed < 4 THEN
        RETURN QUERY SELECT false, 'Family Responsibility Leave requires at least 4 months of employment'::TEXT, v_working_days, false;
        RETURN;
      END IF;

      -- Must work 4+ days per week
      IF v_work_days_per_week < 4 THEN
        RETURN QUERY SELECT false, 'Family Responsibility Leave requires working at least 4 days per week'::TEXT, v_working_days, false;
        RETURN;
      END IF;

      -- Cannot exceed 3 days
      IF v_working_days > 3 THEN
        RETURN QUERY SELECT false, 'Family Responsibility Leave is limited to 3 days per year'::TEXT, v_working_days, false;
        RETURN;
      END IF;

      -- Reason is required
      IF p_reason IS NULL OR p_reason = '' THEN
        RETURN QUERY SELECT false, 'Family Responsibility Leave requires a valid reason'::TEXT, v_working_days, false;
        RETURN;
      END IF;

      RETURN QUERY SELECT true, 'Valid Family Responsibility Leave request'::TEXT, v_working_days, false;

    WHEN 'Shared Parental Leave' THEN
      -- Shared Parental Leave: 130 days total per event (4 months + 10 days)
      -- Must be manually allocated by admin - check if balance exists
      SELECT COALESCE(SUM(lb.total_days), 0), COALESCE(SUM(lb.used_days), 0)
      INTO v_shared_parental_available, v_shared_parental_used
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.user_id = p_user_id
        AND lt.name = 'Shared Parental Leave';

      -- Check if balance has been allocated
      IF v_shared_parental_available = 0 THEN
        RETURN QUERY SELECT false, 
          'Shared Parental Leave must be manually allocated by admin for each parenting event (130 days). Please contact HR.'::TEXT, 
          v_working_days, false;
        RETURN;
      END IF;

      -- Check if enough balance remains
      IF v_working_days > (v_shared_parental_available - v_shared_parental_used) THEN
        RETURN QUERY SELECT false, 
          'Insufficient Shared Parental Leave balance. You have ' || 
          ROUND(v_shared_parental_available - v_shared_parental_used, 2) || ' days remaining of ' ||
          v_shared_parental_available || ' days allocated.'::TEXT,
          v_working_days, false;
        RETURN;
      END IF;

      -- Informational message (not blocking) for consecutive days
      IF v_working_days > 10 THEN
        RETURN QUERY SELECT true, 
          'Valid Shared Parental Leave request (' || v_working_days || ' days). Balance: ' ||
          ROUND(v_shared_parental_available - v_shared_parental_used, 2) || ' of ' || 
          v_shared_parental_available || ' days remaining.'::TEXT, 
          v_working_days, false;
      ELSE
        RETURN QUERY SELECT true, 'Valid Shared Parental Leave request'::TEXT, v_working_days, false;
      END IF;

    ELSE
      -- Default validation for other leave types
      RETURN QUERY SELECT true, 'Valid leave request'::TEXT, v_working_days, false;
  END CASE;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_sa_leave_request IS 
  'Validates leave requests according to SA labour law (BCEA).
   Shared Parental Leave: 130 days total per event (manually allocated by admin).
   Checks balance availability and provides clear guidance.';
