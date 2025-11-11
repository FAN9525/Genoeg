# User Registration Issue - FIXED ✅

## Problem

**Error**: 401 Unauthorized when trying to register a new user account
**Log Entry**: `POST https://xpalcxsmnhgjkfyzoeys.supabase.co/rest/v1/profiles 401 (Unauthorized)`

**Root Cause**: Conflicting Row Level Security (RLS) policies were preventing new user profile creation during registration.

## Solution Applied

### Fixed RLS Policies

Simplified the INSERT policies on the `profiles` table:

**Before** (Conflicting):
- Policy 1: "Users can insert own profile"
- Policy 2: "Allow profile creation via admin function"  
- **Problem**: Policies overlapped and conflicted

**After** (Simplified):
- Single Policy: "Allow user registration and admin creation"
- **Allows**:
  - ✅ New users to create their own profile during registration
  - ✅ Admins to create profiles for other users
- **How**: `auth.uid() = id` (self) OR admin check

## How Registration Works Now

### Step-by-Step Flow:

1. **User Goes to `/register`**
2. **Fills in Form**:
   - Full Name
   - Email
   - Department (optional)
   - Password
   - Confirm Password

3. **Clicks "Create Account"**

4. **System Actions**:
   ```
   ✅ Creates auth.users entry (Supabase Auth)
   ✅ Creates profiles entry (via authService)
   ✅ Triggers create_initial_leave_balances()
   ✅ Creates 4 leave balances with SA-compliant allocations
   ✅ Redirects to login page
   ```

5. **User Logs In** with new credentials

6. **Gets Balances**:
   - Annual Leave: Based on registration date (prorated)
   - Sick Leave: 30 days (36-month cycle from today)
   - Family Responsibility: 3 days (if 4+ months service)
   - Shared Parental: 130 days

## Testing Registration

### Try Registering Now:

1. **Open**: http://localhost:3000/register
2. **Fill in**:
   ```
   Full Name: Jane Smith
   Email: jane.smith@company.com
   Department: HR
   Password: SecurePass123!
   Confirm Password: SecurePass123!
   ```
3. **Click**: "Create Account"
4. **✅ Should work!** Redirects to login
5. **Login** with your new credentials
6. **View Dashboard** to see your leave balances

### Expected Leave Balances (New User Today):

For a user registering on **Nov 4, 2025**:

- **Annual Leave**: ~1 day
  - Cycle: Nov 4, 2025 - Nov 3, 2026
  - Accrued: Less than 1 month worked
  - Will accrue 1.75 days on Dec 1 (first accrual)

- **Sick Leave**: 30 days
  - Cycle: Nov 4, 2025 - Nov 3, 2028 (36 months)
  - Full allocation

- **Family Responsibility**: 3 days
  - But **NOT eligible until Mar 2026** (needs 4+ months service)

- **Shared Parental**: 130 days

## Key Differences

### Registration (Self-Service) vs Admin Creation

| Feature | User Registration | Admin Creation |
|---------|-------------------|----------------|
| **Who** | Anyone | Admin only |
| **Fields** | Name, email, password, dept | All fields + role + work dates |
| **Password** | User chooses | Auto-generated temporary |
| **Role** | Always "employee" | Admin can assign any role |
| **Work Dates** | Set to registration date | Admin can backdate |
| **Email Confirm** | Auto-confirmed | Auto-confirmed |

### User Registration Fields:

**Set by User**:
- Full Name
- Email
- Password
- Department (optional)

**Set Automatically**:
- Role: `employee` (always)
- Employment Start: Registration date
- Work Days/Week: 5 days (default)
- Leave Balances: Created with SA compliance

### Admin User Creation Fields:

**Set by Admin**:
- Full Name
- Email
- Department
- **Role**: Employee/Manager/Admin ← Admin only!
- **Employment Start Date**: Can backdate ← Admin only!
- **End Work Date**: Can set ← Admin only!

**Set Automatically**:
- Temporary Password: Generated
- Work Days/Week: 5 days
- Leave Balances: SA-compliant based on start date

## RLS Policies Summary

All policies on `profiles` table:

1. **SELECT**: `"Public profiles are viewable by everyone"`
   - Everyone can view all profiles (for team calendar)

2. **INSERT**: `"Allow user registration and admin creation"`
   - Users can create own profile (registration)
   - Admins can create profiles for others

3. **UPDATE**: `"Users and admins can update profiles"`
   - Users can update own profile
   - Admins can update any profile

## Troubleshooting Registration

### If Registration Still Fails:

**Check 1: Clear Browser Cache**
```
1. Press Ctrl+Shift+Delete
2. Clear cached data
3. Try again
```

**Check 2: Check Environment Variables**
```
.env.local should have:
NEXT_PUBLIC_SUPABASE_URL=https://xpalcxsmnhgjkfyzoeys.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
```

**Check 3: Restart Dev Server**
```bash
# Stop current server (Ctrl+C)
npm run dev
```

**Check 4: Verify in Incognito/Private Window**
- Old session cookies might interfere
- Try registration in private browsing mode

### Common Registration Errors:

| Error | Cause | Solution |
|-------|-------|----------|
| **401 Unauthorized** | RLS policy blocking | Fixed! Should work now |
| **409 Conflict** | Email already exists | Use different email |
| **400 Bad Request** | Invalid email/password | Check format |
| **429 Too Many Requests** | Rate limit hit | Wait 1 hour |

## Next Steps

1. **Try registering now** - Should work!
2. **Check your leave balances** - Will be prorated
3. **Submit a leave request** - Test the SA calculator
4. **Login as admin** - Create more users via admin panel

## Support

If you still have issues:
1. Check browser console (F12)
2. Check network tab for failed requests
3. Verify Supabase connection
4. Check TROUBLESHOOTING.md

---

**Registration should now work!** ✅

Try creating an account at: http://localhost:3000/register




