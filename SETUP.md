# Genoeg Gewerk - Setup Guide

Complete step-by-step guide to set up the Genoeg Gewerk leave management system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Local Development Setup](#local-development-setup)
4. [Database Configuration](#database-configuration)
5. [Testing the Application](#testing-the-application)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18 or higher** installed ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- A **Supabase account** ([Sign up](https://supabase.com))
- **Git** installed (optional, for version control)

## Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: Genoeg Gewerk (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development
4. Click "Create new project"
5. Wait for the project to be provisioned (2-3 minutes)

### Step 2: Get Your API Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **Anon/Public key** (starts with "eyJ...")

### Step 3: Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Open the file `genoeg-gewerk/supabase/migrations/00001_initial_schema.sql`
4. Copy the entire contents
5. Paste into the Supabase SQL Editor
6. Click "Run" or press Ctrl/Cmd + Enter
7. You should see "Success. No rows returned"

This creates:
- All database tables
- Security policies (RLS)
- Initial leave types
- Automatic triggers

### Step 4: Verify Database Setup

1. Go to **Table Editor** in Supabase
2. You should see these tables:
   - profiles
   - leave_types
   - leaves
   - leave_balances
3. Click on **leave_types** - you should see 5 default leave types

## Local Development Setup

### Step 1: Install Dependencies

\`\`\`bash
cd genoeg-gewerk
npm install
\`\`\`

This installs all required packages including:
- Next.js 14
- React 18
- Supabase client
- shadcn/ui components
- date-fns, zod, react-hook-form

### Step 2: Configure Environment Variables

1. Create a \`.env.local\` file in the project root:

\`\`\`bash
cp .env.example .env.local
\`\`\`

2. Open \`.env.local\` and add your Supabase credentials:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
\`\`\`

Replace with the values from Step 2 of Supabase Setup.

### Step 3: Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The app will be available at [http://localhost:3000](http://localhost:3000)

## Database Configuration

### Understanding the Schema

**profiles** - Extended user information
- Linked to Supabase auth.users
- Stores: name, email, department, role, avatar

**leave_types** - Types of leave
- Pre-populated with 5 types
- Customizable colors and day limits

**leaves** - Leave requests
- Status: pending, approved, rejected, cancelled
- Automatic business day calculation

**leave_balances** - User leave balances
- Automatically created for new users
- Tracks total, used, and remaining days

### Security (Row Level Security)

All tables have RLS enabled. Policies ensure:
- Users can only modify their own data
- All users can view team calendars (approved leaves)
- Sensitive operations are restricted

## Testing the Application

### Step 1: Create a Test User

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Get Started" or navigate to `/register`
3. Fill in the form:
   - **Full Name**: Test User
   - **Email**: test@example.com
   - **Department**: Engineering
   - **Password**: password123
4. Click "Create Account"

### Step 2: Sign In

1. You'll be redirected to the login page
2. Sign in with:
   - **Email**: test@example.com
   - **Password**: password123

### Step 3: Verify Leave Balances

After signing in, check the dashboard:
- You should see leave balance cards
- Default balances are created automatically
- Example: 20 days Annual Leave, 10 days Sick Leave, etc.

### Step 4: Submit a Leave Request

1. Click "Request Leave"
2. Select leave type: Annual Leave
3. Choose dates (e.g., next Monday to Friday)
4. Add a reason (optional)
5. Click "Submit Leave Request"
6. Check "My Leaves" to see your pending request

### Step 5: View Team Calendar

1. Navigate to "Team Calendar"
2. You won't see your request yet (it's pending)
3. Only approved leaves appear on the team calendar

## Deployment

### Deploy to Vercel

#### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: npm run build
   - **Output Directory**: .next
5. Add Environment Variables:
   - \`NEXT_PUBLIC_SUPABASE_URL\` → your Supabase URL
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` → your anon key
6. Click "Deploy"

#### Option 2: Deploy via Vercel CLI

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts and add environment variables when asked
\`\`\`

### Post-Deployment

1. Your app will be live at: `https://your-project.vercel.app`
2. Test registration and login
3. Verify all features work in production

## Troubleshooting

### Common Issues

#### 1. "Failed to fetch" or authentication errors

**Problem**: Environment variables not set correctly

**Solution**:
- Check \`.env.local\` has correct Supabase URL and key
- Restart dev server after changing env vars
- Ensure no extra spaces in the env file

#### 2. "Row Level Security policy violation"

**Problem**: RLS policies not created or incorrect

**Solution**:
- Re-run the migration SQL in Supabase SQL Editor
- Check that RLS is enabled on all tables
- Verify user is authenticated

#### 3. Leave balances not created automatically

**Problem**: Trigger function not working

**Solution**:
- Check if the \`on_profile_created\` trigger exists in Supabase
- Manually create balances by running:

\`\`\`sql
-- Replace YOUR_USER_ID with actual user ID
INSERT INTO leave_balances (user_id, leave_type_id, year, total_days, remaining_days)
SELECT 'YOUR_USER_ID', id, EXTRACT(YEAR FROM CURRENT_DATE), max_days_per_year, max_days_per_year
FROM leave_types;
\`\`\`

#### 4. TypeScript errors

**Problem**: Missing types or incorrect imports

**Solution**:
\`\`\`bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Restart TypeScript server in VS Code
# Press Ctrl+Shift+P → "TypeScript: Restart TS Server"
\`\`\`

#### 5. Build fails on Vercel

**Problem**: Missing dependencies or environment variables

**Solution**:
- Check all dependencies are in package.json
- Verify environment variables in Vercel dashboard
- Check build logs for specific errors

### Getting Help

If you encounter issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review [Next.js documentation](https://nextjs.org/docs)
3. Check browser console for errors
4. Check Supabase logs in the dashboard
5. Open an issue on GitHub

## Next Steps

- Customize leave types in Supabase Table Editor
- Add admin approval workflow (future enhancement)
- Set up email notifications
- Configure custom domains in Vercel
- Add more leave types or customize existing ones

---

**You're all set! Happy leave managing! 🎉**

