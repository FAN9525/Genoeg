# Troubleshooting Guide - Genoeg Gewerk

## Common Issues and Solutions

### 1. "429 Too Many Requests" Error During Sign Up

**Error Message:**
```
POST https://[your-project].supabase.co/auth/v1/signup 429 (Too Many Requests)
```

**Cause:** Supabase rate limiting on the free tier (typically 30-60 sign ups per hour).

**Solutions:**

#### Option A: Wait (Easiest)
- Rate limit resets after **1 hour**
- Try again after waiting

#### Option B: Create User in Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **Add user** → **Create new user**
5. Enter:
   - Email: `test@example.com`
   - Password: `password123`
   - **Enable "Auto Confirm User"** ✅
6. Click **Create user**
7. Use these credentials to log in

#### Option C: Disable Email Confirmation (Dev Only)
1. Go to Supabase Dashboard → **Authentication** → **Email Auth**
2. Disable **"Enable email confirmations"** for development
3. Re-enable for production!

#### Option D: Use SQL to Create Test Users
```sql
-- Run in Supabase SQL Editor
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Then create the profile
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  department,
  role
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  'test@example.com',
  'Test User',
  'Engineering',
  'employee'
);
```

---

### 2. "Cannot Fetch" or Connection Errors

**Cause:** Environment variables not set correctly.

**Solution:**
1. Check `.env.local` exists in project root
2. Verify it contains:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Restart dev server: `npm run dev`

---

### 3. "Row Level Security Policy Violation"

**Cause:** RLS policies not set up correctly.

**Solution:**
1. Go to Supabase SQL Editor
2. Re-run the migration: `supabase/migrations/00001_initial_schema.sql`
3. Verify RLS is enabled on all tables:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

---

### 4. Leave Balances Not Created Automatically

**Cause:** Trigger function not working.

**Solution:**

Run this SQL to manually create balances for a user:

```sql
-- Replace 'USER_ID_HERE' with actual user ID
INSERT INTO leave_balances (user_id, leave_type_id, year, total_days, used_days, remaining_days)
SELECT 
  'USER_ID_HERE'::uuid,
  id,
  EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  max_days_per_year,
  0,
  max_days_per_year
FROM leave_types;
```

---

### 5. TypeScript Errors in IDE

**Cause:** Types not updated or dependencies not installed.

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Restart TypeScript server in VS Code
# Press Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

### 6. Build Fails on Network Drive (Windows)

**Cause:** Windows UNC path issues with Turbopack.

**Solution:**
- **Development:** Use `npm run dev` (works fine)
- **Production:** Deploy to Vercel (no issues)
- **Local build:** Copy project to `C:\projects\` and build there

---

### 7. "Auth Session Missing" Error

**Cause:** User not logged in or session expired.

**Solution:**
1. Log out and log back in
2. Clear browser cookies for localhost
3. Check middleware is working: verify `middleware.ts` exists

---

### 8. No Leave Types Showing

**Cause:** Default leave types not inserted.

**Solution:**

Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO leave_types (name, description, color, max_days_per_year) VALUES
  ('Annual Leave', 'Paid annual vacation leave', '#3B82F6', 20),
  ('Sick Leave', 'Leave for illness or medical appointments', '#EF4444', 10),
  ('Personal Leave', 'Personal or family emergencies', '#F59E0B', 5),
  ('Maternity Leave', 'Maternity or parental leave', '#EC4899', 90),
  ('Study Leave', 'Leave for educational purposes', '#8B5CF6', 5)
ON CONFLICT (name) DO NOTHING;
```

---

### 9. Calendar Not Showing Team Leaves

**Cause:** Only approved leaves show on team calendar.

**Solution:**
1. Leaves must be approved to appear on team calendar
2. For testing, manually approve a leave in Supabase:
   ```sql
   UPDATE leaves 
   SET status = 'approved' 
   WHERE id = 'YOUR_LEAVE_ID';
   ```

---

### 10. Date Calculation Shows Wrong Days

**Cause:** Business days calculation excludes weekends.

**Expected Behavior:**
- Monday to Friday (5 days) = 5 business days ✅
- Friday to Monday (4 days) = 2 business days ✅ (excludes weekend)

This is correct! The system automatically excludes Saturdays and Sundays.

---

## Development Tips

### Reset Database
To start fresh:

```sql
-- WARNING: This deletes ALL data!
TRUNCATE TABLE leave_balances CASCADE;
TRUNCATE TABLE leaves CASCADE;
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE leave_types CASCADE;

-- Then re-run the migration
```

### Clear All Test Data

```sql
-- Delete all test users (keeps database structure)
DELETE FROM profiles WHERE email LIKE '%test%' OR email LIKE '%example%';
```

### Check What's in Database

```sql
-- See all users
SELECT id, email, full_name, department FROM profiles;

-- See all leaves
SELECT l.*, p.full_name, lt.name as leave_type
FROM leaves l
JOIN profiles p ON l.user_id = p.id
JOIN leave_types lt ON l.leave_type_id = lt.id
ORDER BY l.created_at DESC;

-- See all balances
SELECT lb.*, p.full_name, lt.name as leave_type
FROM leave_balances lb
JOIN profiles p ON lb.user_id = p.id
JOIN leave_types lt ON lb.leave_type_id = lt.id;
```

---

## Getting Help

If you're still stuck:

1. **Check Supabase Logs:**
   - Dashboard → Logs → Select service (API, Auth, etc.)
   - Look for errors around the time of issue

2. **Check Browser Console:**
   - Press F12 → Console tab
   - Look for red error messages

3. **Check Network Tab:**
   - F12 → Network tab
   - Look for failed requests (red)
   - Click on them to see error details

4. **Verify Environment:**
   ```bash
   # Check Node version (should be 18+)
   node --version
   
   # Check if dev server is running
   npm run dev
   ```

---

## Quick Fixes Checklist

- [ ] Supabase project created?
- [ ] Migration SQL ran successfully?
- [ ] `.env.local` file exists with correct values?
- [ ] Dev server restarted after env changes?
- [ ] Browser cache cleared?
- [ ] User confirmed in Supabase Auth panel?
- [ ] Leave types exist in database?
- [ ] RLS policies enabled?

---

**Most issues can be solved by re-running the migration and restarting the dev server!** ✨

