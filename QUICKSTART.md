# Genoeg Gewerk - Quick Start (5 Minutes)

Get up and running with Genoeg Gewerk in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works!)

## Step 1: Install Dependencies (1 min)

\`\`\`bash
npm install
\`\`\`

## Step 2: Set Up Supabase (2 min)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Settings** → **API**
3. Copy your **Project URL** and **Anon Key**

## Step 3: Configure Environment (30 sec)

Create a \`.env.local\` file in the project root:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
\`\`\`

Replace with your actual Supabase credentials.

## Step 4: Set Up Database (1 min)

1. In Supabase dashboard, go to **SQL Editor**
2. Open \`supabase/migrations/00001_initial_schema.sql\` in this project
3. Copy all contents
4. Paste in Supabase SQL Editor and click **Run**

## Step 5: Start Development Server (30 sec)

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) 🎉

## First Steps

1. **Create Account**: Click "Get Started" → Fill in your details
2. **Sign In**: Log in with your new account
3. **View Dashboard**: See your leave balances (auto-created!)
4. **Request Leave**: Click "Request Leave" and submit your first request
5. **View Calendar**: Check the team calendar

## What You Get

✅ Complete authentication system
✅ Leave request forms with validation
✅ Personal dashboard with statistics
✅ Team calendar view
✅ Multiple leave types (Annual, Sick, Personal, etc.)
✅ Automatic leave balance tracking
✅ Beautiful, responsive UI

## Default Leave Types

After running the migration, you'll have:
- 🏖️ Annual Leave (20 days/year)
- 🤒 Sick Leave (10 days/year)
- 🏠 Personal Leave (5 days/year)
- 👶 Maternity Leave (90 days/year)
- 📚 Study Leave (5 days/year)

## Need Help?

- 📖 Full setup guide: See `SETUP.md`
- 📚 Complete documentation: See `README.md`
- ❓ Troubleshooting: Check `SETUP.md` troubleshooting section

## Deploy to Production

When ready to deploy:

\`\`\`bash
# Build the project
npm run build

# Or deploy to Vercel
vercel
\`\`\`

See `README.md` for full deployment instructions.

---

**That's it! You're ready to manage leaves! 🚀**

