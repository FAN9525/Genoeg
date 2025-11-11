-- Change total_days from INTEGER to NUMERIC to support half-day leaves (0.5 days)

-- ============================================================================
-- Step 1: Drop view that depends on total_days
-- ============================================================================

DROP VIEW IF EXISTS admin_user_stats;

-- ============================================================================
-- Step 2: Alter column types to support decimal values
-- ============================================================================

-- Change total_days from INTEGER to NUMERIC(5,2) in leaves table
ALTER TABLE leaves 
ALTER COLUMN total_days TYPE NUMERIC(5,2);

-- Also update leave_balances to use NUMERIC for consistency and half-day support
ALTER TABLE leave_balances
ALTER COLUMN total_days TYPE NUMERIC(7,2),
ALTER COLUMN used_days TYPE NUMERIC(7,2),
ALTER COLUMN remaining_days TYPE NUMERIC(7,2);

-- ============================================================================
-- Step 3: Recreate admin_user_stats view
-- ============================================================================

CREATE VIEW admin_user_stats AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.department,
  p.role,
  p.start_work_date,
  p.end_work_date,
  
  -- Count total leave requests
  COALESCE(
    (SELECT COUNT(*) 
     FROM leaves l 
     WHERE l.user_id = p.id),
    0
  ) AS total_leaves,
  
  -- Count pending leave requests
  COALESCE(
    (SELECT COUNT(*) 
     FROM leaves l 
     WHERE l.user_id = p.id 
       AND l.status = 'pending'),
    0
  ) AS pending_leaves,
  
  -- Sum total balance for current year only
  COALESCE(
    (SELECT SUM(lb.total_days)
     FROM leave_balances lb
     WHERE lb.user_id = p.id
       AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
    0
  ) AS total_balance,
  
  -- Sum used days for current year only
  COALESCE(
    (SELECT SUM(lb.used_days)
     FROM leave_balances lb
     WHERE lb.user_id = p.id
       AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
    0
  ) AS used_days,
  
  -- Sum remaining days for current year only
  COALESCE(
    (SELECT SUM(lb.remaining_days)
     FROM leave_balances lb
     WHERE lb.user_id = p.id
       AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
    0
  ) AS remaining_days

FROM profiles p
ORDER BY p.full_name;

COMMENT ON VIEW admin_user_stats IS 
  'Aggregated user statistics for admin panel. 
   Shows leave balances for the current year only.
   Supports decimal values for half-day leave tracking.';

-- ============================================================================
-- Add comments to clarify decimal support
-- ============================================================================

COMMENT ON COLUMN leaves.total_days IS 
  'Number of working days for this leave (excludes weekends and public holidays).
   NUMERIC type supports half-day leaves (0.5 days).
   Full-day leaves are whole numbers (1, 2, 3, etc.).';

COMMENT ON COLUMN leave_balances.total_days IS 
  'Total leave days allocated (NUMERIC supports half-day increments and accurate accrual)';

COMMENT ON COLUMN leave_balances.used_days IS 
  'Total days used including half-day leaves (supports 0.5 increments)';

COMMENT ON COLUMN leave_balances.remaining_days IS 
  'Remaining days available (supports decimal values for half-day leaves)';

