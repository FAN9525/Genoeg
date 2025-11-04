# Admin Guide - Genoeg Gewerk

## Overview

This guide covers all administrative features of the Genoeg Gewerk leave management system, including user management, role assignment, and leave approvals.

## User Roles

The system has three user roles with different permissions:

### 👤 Employee (Default)
- Submit leave requests
- View own leave history and balances
- Cancel own pending leave requests
- View team calendar

### 👥 Manager
- All employee permissions, plus:
- Approve or reject leave requests
- View pending leave requests from all employees

### 🛡️ Admin (Full Access)
- All manager permissions, plus:
- Create new users
- Assign and change user roles
- Manage work dates for employees
- View system-wide statistics
- Full user management

## Admin Features

### 1. Admin Dashboard

**Path**: `/admin`

The admin dashboard provides:
- **System Overview**: Total users, total leaves, pending approvals
- **Quick Access**: Links to user management and leave approvals
- **Statistics**: Real-time system metrics

### 2. User Management

**Path**: `/admin/users`

#### Creating New Users

1. Click **"Create User"** button
2. Fill in the form:
   - **Full Name**: Required
   - **Email**: Required (must be unique)
   - **Department**: Optional
   - **Role**: Employee, Manager, or Admin
   - **Start Work Date**: Required - determines leave allocation
   - **End Work Date**: Optional - leave blank for current employees

3. Click **"Create User"**
4. A **temporary password** will be generated and displayed
5. **IMPORTANT**: Copy the password immediately - it won't be shown again!
6. Share the credentials with the new user securely

#### Prorated Leave Calculation

The system automatically calculates leave days based on the start work date:

**Example**:
- Employee starts: July 1, 2025
- Annual leave allocation: 20 days/year
- Prorated days: ~10 days (half year remaining)

**Formula**: 
```
Prorated Days = (Total Days × Days Remaining in Year) ÷ Days in Year
```

#### Managing Users

From the Users Table:
- **Change Role**: Use dropdown to change employee/manager/admin status
- **View Leave Stats**: See total balance, used days, pending requests
- **Check Status**: Active (no end date) or Inactive (has end date)

### 3. Leave Approvals

**Path**: `/admin/approvals`

**Available to**: Managers and Admins

#### Approving Leaves

1. View all pending leave requests in the table
2. Review:
   - Employee name and department
   - Leave type (with color indicator)
   - Date range and total days
   - Reason (if provided)

3. Click **"Approve"** to accept the request
   - Leave balance is automatically updated
   - Used days increase
   - Remaining days decrease

4. Click **"Reject"** to decline the request
   - No change to leave balance
   - Request status changes to "rejected"

## Work Date Management

### Start Work Date

**Purpose**: Determines when employee leave accrual begins

**Features**:
- Automatically prorates leave allocation
- Can be retroactive (past date)
- Used for calculating entitlement

**Example Scenarios**:

1. **New Hire - January 1**
   ```
   Start Date: 2025-01-01
   Annual Leave: 20 days (full allocation)
   ```

2. **Mid-Year Hire - July 1**
   ```
   Start Date: 2025-07-01
   Annual Leave: ~10 days (prorated for 6 months)
   ```

3. **Late-Year Hire - November 1**
   ```
   Start Date: 2025-11-01
   Annual Leave: ~3 days (prorated for 2 months)
   ```

### End Work Date

**Purpose**: Marks when employee left the company

**Features**:
- Leave blank for active employees
- Set date when employee departs
- Prevents future leave requests
- Marks employee as "Inactive"

**To Deactivate an Employee**:
1. Edit user profile
2. Set End Work Date to last working day
3. User status changes to "Inactive"

## Security & Permissions

### Row Level Security (RLS)

All tables have RLS policies:

- **Profiles**: Users see all, but only admins can create/modify
- **Leaves**: Everyone views, only owner or managers can modify
- **Balances**: Visible to all, managed by system

### Admin-Only Operations

These require admin role:
- ✅ Creating users
- ✅ Changing user roles
- ✅ Managing work dates
- ✅ Viewing user statistics
- ✅ System configuration

### Manager Operations

Managers can:
- ✅ Approve/reject leave requests
- ✅ View all pending requests
- ❌ Cannot create users
- ❌ Cannot change roles

## Best Practices

### Creating Users

1. ✅ **Always set start work date** - Determines correct leave allocation
2. ✅ **Use company email addresses** - Ensures unique identifiers
3. ✅ **Assign correct role from the start** - Saves later adjustments
4. ✅ **Share password securely** - Use secure channels (not email)
5. ✅ **Encourage password change** - Users should change temp password

### Managing Roles

1. ✅ **Be conservative with admin** - Limit to trusted personnel
2. ✅ **Promote to manager carefully** - They can approve all leaves
3. ✅ **Document role changes** - Keep audit trail
4. ✅ **Review periodically** - Ensure roles match responsibilities

### Leave Approvals

1. ✅ **Review promptly** - Don't leave requests pending long
2. ✅ **Check balances** - Ensure employee has days available
3. ✅ **Consider team impact** - Check team calendar for conflicts
4. ✅ **Communicate decisions** - Follow up with employee

### Work Date Accuracy

1. ✅ **Set accurate start dates** - Affects entire leave allocation
2. ✅ **Update end dates promptly** - When employees leave
3. ✅ **Backfill if needed** - Can update past dates if incorrect
4. ✅ **Verify balances** - Check calculations are correct

## Admin Workflows

### Onboarding New Employee

```
1. Go to Admin → User Management
2. Click "Create User"
3. Enter:
   - Full Name: John Doe
   - Email: john.doe@company.com
   - Department: Engineering
   - Role: Employee
   - Start Date: 2025-01-15
4. Create User
5. Copy temporary password
6. Send credentials to new employee via secure channel
7. Verify leave balances were created correctly
```

### Promoting to Manager

```
1. Go to Admin → User Management
2. Find the user in table
3. Change Role dropdown: Employee → Manager
4. User immediately gains approval permissions
5. Notify user of new responsibilities
```

### Handling Employee Departure

```
1. Go to Admin → User Management
2. Find the user
3. Edit to add End Work Date
4. Set to last working day
5. User marked as "Inactive"
6. No new leave requests possible
```

### Approving Leave Requests

```
1. Go to Admin → Approve Leaves
2. Review pending request details:
   - Employee info
   - Dates and duration
   - Reason provided
3. Check team calendar for conflicts
4. Click "Approve" or "Reject"
5. System automatically updates balances
```

## Troubleshooting

### User Can't Create Leaves

**Possible causes**:
- ❌ End work date set (inactive user)
- ❌ No leave balance (missing start date)
- ❌ Insufficient remaining days

**Fix**: Check profile has start date and balances exist

### Leave Balances Not Showing

**Possible causes**:
- ❌ No start work date set
- ❌ Trigger didn't fire on creation
- ❌ Database sync issue

**Fix**: 
```sql
-- Manually create balances for user
-- Replace USER_ID with actual ID
INSERT INTO leave_balances (user_id, leave_type_id, year, total_days, used_days, remaining_days)
SELECT 
  'USER_ID'::uuid,
  id,
  EXTRACT(YEAR FROM CURRENT_DATE),
  max_days_per_year,
  0,
  max_days_per_year
FROM leave_types;
```

### Can't Approve Leaves

**Check**:
- ✅ You have Manager or Admin role
- ✅ Leave is in "pending" status
- ✅ RLS policies are correct

### Temporary Password Not Saved

**Reminder**: 
- Temporary password shown only once
- If lost, admin must reset password manually
- Use Supabase dashboard to reset if needed

## Current Admin User

For this system:

**Admin Account**:
- Email: `test@genoeg.com`
- Password: `Password123!`
- Role: Admin
- Start Date: January 1, 2024

**Leave Balances** (Full allocation):
- Annual Leave: 20 days
- Sick Leave: 10 days
- Personal Leave: 5 days
- Maternity Leave: 90 days
- Study Leave: 5 days

## Support

For issues with admin features:
1. Check TROUBLESHOOTING.md
2. Review Supabase logs
3. Check browser console for errors
4. Verify database permissions

---

**Remember**: With great power comes great responsibility. Use admin privileges wisely! 🛡️

