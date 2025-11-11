-- Drop existing view if it exists and recreate with correct logic
DROP VIEW IF EXISTS admin_user_stats;

-- Create admin_user_stats view for user management
-- This view provides aggregated statistics for each user
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

-- Add comment to explain the view
COMMENT ON VIEW admin_user_stats IS 
  'Aggregated user statistics for admin panel. 
   Shows leave balances for the current year only.';

