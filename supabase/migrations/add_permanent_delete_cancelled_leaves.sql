-- Add function to permanently delete cancelled leaves
-- Allow users to cleanup their cancelled leave history

-- ============================================================================
-- Create function to permanently delete cancelled leaves
-- ============================================================================

CREATE OR REPLACE FUNCTION permanently_delete_cancelled_leave(
  p_leave_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_leave RECORD;
BEGIN
  -- Get leave details
  SELECT * INTO v_leave
  FROM leaves
  WHERE id = p_leave_id
    AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false,
      'Leave request not found or you do not have permission to delete it';
    RETURN;
  END IF;

  -- Only allow deletion of cancelled leaves
  IF v_leave.status != 'cancelled' THEN
    RETURN QUERY SELECT 
      false,
      'Only cancelled leaves can be permanently deleted. Current status: ' || v_leave.status;
    RETURN;
  END IF;

  -- Permanently delete the leave record
  DELETE FROM leaves
  WHERE id = p_leave_id;

  RETURN QUERY SELECT 
    true,
    'Leave record permanently deleted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION permanently_delete_cancelled_leave IS 
  'Permanently deletes a cancelled leave from the database.
   Only cancelled leaves can be deleted.
   This action cannot be undone.
   Used for cleanup and maintaining clean leave history.';

-- ============================================================================
-- Create function to bulk delete all cancelled leaves for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_all_cancelled_leaves(
  p_user_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  deleted_count INTEGER
) AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete all cancelled leaves for this user
  DELETE FROM leaves
  WHERE user_id = p_user_id
    AND status = 'cancelled';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN QUERY SELECT 
    true,
    'Cleaned up ' || v_deleted_count || ' cancelled leave(s)',
    v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_all_cancelled_leaves IS 
  'Permanently deletes ALL cancelled leaves for a user.
   Used for bulk cleanup of cancelled leave history.
   This action cannot be undone.';

