-- Add half-day leave support
-- Allow users to request half-day leave (morning: 08h00-12h00 or afternoon: 12h30-16h30)

-- ============================================================================
-- Add half-day tracking fields to leaves table
-- ============================================================================

ALTER TABLE leaves
ADD COLUMN IF NOT EXISTS is_half_day BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS half_day_period VARCHAR(10) CHECK (half_day_period IN ('morning', 'afternoon') OR half_day_period IS NULL);

-- ============================================================================
-- Add comments
-- ============================================================================

COMMENT ON COLUMN leaves.is_half_day IS 
  'Whether this is a half-day leave request (true) or full-day (false)';

COMMENT ON COLUMN leaves.half_day_period IS 
  'For half-day leaves: morning (08h00-12h00) or afternoon (12h30-16h30)';

-- ============================================================================
-- Update check_leave_date_conflict to handle half-day conflicts
-- ============================================================================

CREATE OR REPLACE FUNCTION check_leave_date_conflict(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_is_half_day BOOLEAN DEFAULT false,
  p_half_day_period VARCHAR(10) DEFAULT NULL,
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
  -- For half-day leaves, only check same date
  IF p_is_half_day THEN
    -- Check if same date has a full-day leave OR same half-day period
    SELECT 
      l.id,
      l.start_date,
      l.end_date,
      l.is_half_day,
      l.half_day_period,
      l.status,
      lt.name as leave_type_name
    INTO v_conflict
    FROM leaves l
    JOIN leave_types lt ON l.leave_type_id = lt.id
    WHERE l.user_id = p_user_id
      AND l.status IN ('approved', 'pending')
      AND (l.id != p_exclude_leave_id OR p_exclude_leave_id IS NULL)
      AND p_start_date = l.start_date
      AND p_start_date = l.end_date  -- Half-day must be single date
      AND (
        -- Conflict if existing leave is full-day on same date
        l.is_half_day = false
        OR 
        -- Conflict if same half-day period
        (l.is_half_day = true AND l.half_day_period = p_half_day_period)
      )
    LIMIT 1;
    
    IF FOUND THEN
      RETURN QUERY SELECT 
        true,
        'Date conflict: ' || 
        CASE 
          WHEN v_conflict.is_half_day = false THEN 'You have a full-day ' || v_conflict.leave_type_name || ' on this date'
          ELSE 'You already have ' || v_conflict.half_day_period || ' leave on this date'
        END || 
        ' (' || v_conflict.start_date || ') which is ' || v_conflict.status || '.',
        v_conflict.id;
      RETURN;
    END IF;
  ELSE
    -- For full-day leaves, check normal overlap including half-day conflicts
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
      RETURN;
    END IF;
  END IF;
  
  -- No conflicts found
  RETURN QUERY SELECT 
    false,
    'No date conflicts found',
    NULL::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Update conflict prevention triggers to handle half-day
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_leave_date_conflicts()
RETURNS TRIGGER AS $$
DECLARE
  v_conflict RECORD;
BEGIN
  -- Check for conflicts when inserting a new leave
  SELECT * INTO v_conflict
  FROM check_leave_date_conflict(
    NEW.user_id, 
    NEW.start_date, 
    NEW.end_date, 
    COALESCE(NEW.is_half_day, false),
    NEW.half_day_period
  );
  
  IF v_conflict.has_conflict THEN
    RAISE EXCEPTION '%', v_conflict.conflict_message;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_leave_date_conflicts_update()
RETURNS TRIGGER AS $$
DECLARE
  v_conflict RECORD;
BEGIN
  -- Only check if dates are being changed
  IF NEW.start_date != OLD.start_date 
     OR NEW.end_date != OLD.end_date 
     OR NEW.is_half_day != OLD.is_half_day
     OR NEW.half_day_period != OLD.half_day_period THEN
    -- Check for conflicts, excluding the current leave being updated
    SELECT * INTO v_conflict
    FROM check_leave_date_conflict(
      NEW.user_id, 
      NEW.start_date, 
      NEW.end_date,
      COALESCE(NEW.is_half_day, false),
      NEW.half_day_period,
      NEW.id
    );
    
    IF v_conflict.has_conflict THEN
      RAISE EXCEPTION '%', v_conflict.conflict_message;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

