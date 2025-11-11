-- Add cancellation reason tracking to leaves table
-- Allow users to cancel approved leave with a reason

-- ============================================================================
-- Add cancellation tracking fields
-- ============================================================================

ALTER TABLE leaves
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id);

-- ============================================================================
-- Add comments
-- ============================================================================

COMMENT ON COLUMN leaves.cancellation_reason IS 
  'Reason provided by user when cancelling approved leave';

COMMENT ON COLUMN leaves.cancelled_at IS 
  'Timestamp when the leave was cancelled';

COMMENT ON COLUMN leaves.cancelled_by IS 
  'User ID of the person who cancelled the leave (usually the requestor)';

-- ============================================================================
-- Create function to cancel leave with reason
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_leave_request(
  p_leave_id UUID,
  p_user_id UUID,
  p_cancellation_reason TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  leave_id UUID
) AS $$
DECLARE
  v_leave RECORD;
  v_leave_balance_id UUID;
BEGIN
  -- Get leave details
  SELECT * INTO v_leave
  FROM leaves
  WHERE id = p_leave_id
    AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false,
      'Leave request not found or you do not have permission to cancel it',
      p_leave_id;
    RETURN;
  END IF;

  -- Check if leave can be cancelled
  IF v_leave.status = 'cancelled' THEN
    RETURN QUERY SELECT 
      false,
      'This leave has already been cancelled',
      p_leave_id;
    RETURN;
  END IF;

  IF v_leave.status = 'rejected' THEN
    RETURN QUERY SELECT 
      false,
      'Rejected leaves cannot be cancelled',
      p_leave_id;
    RETURN;
  END IF;

  -- Update leave status to cancelled
  UPDATE leaves
  SET 
    status = 'cancelled',
    cancellation_reason = p_cancellation_reason,
    cancelled_at = NOW(),
    cancelled_by = p_user_id,
    updated_at = NOW()
  WHERE id = p_leave_id;

  -- If the leave was approved, restore the leave balance
  IF v_leave.status = 'approved' THEN
    -- Find the leave balance for this leave type and year
    SELECT lb.id INTO v_leave_balance_id
    FROM leave_balances lb
    WHERE lb.user_id = p_user_id
      AND lb.leave_type_id = v_leave.leave_type_id
      AND lb.year = EXTRACT(YEAR FROM v_leave.start_date)::INTEGER;

    IF FOUND THEN
      -- Restore the days back to the balance
      UPDATE leave_balances
      SET 
        used_days = used_days - v_leave.total_days,
        remaining_days = remaining_days + v_leave.total_days,
        updated_at = NOW()
      WHERE id = v_leave_balance_id;
    END IF;
  END IF;

  RETURN QUERY SELECT 
    true,
    'Leave cancelled successfully. ' || 
    CASE 
      WHEN v_leave.status = 'approved' THEN v_leave.total_days || ' days have been restored to your balance.'
      ELSE 'Your pending request has been cancelled.'
    END,
    p_leave_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cancel_leave_request IS 
  'Cancels a leave request with a reason.
   - Can cancel both pending and approved leaves
   - Restores leave balance if approved leave is cancelled
   - Records cancellation reason, timestamp, and who cancelled it
   - Returns success status and user-friendly message';

