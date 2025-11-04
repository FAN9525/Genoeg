# Genoeg Gewerk - Leave Management System

A modern, full-stack personnel leave management system built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- ✅ **User Authentication** - Secure registration and login with Supabase Auth
- ✅ **Leave Requests** - Submit, edit, and cancel leave requests
- ✅ **Leave Tracking** - View personal leave history and balances
- ✅ **Team Calendar** - See team members' approved leaves
- ✅ **Multiple Leave Types** - Annual, Sick, Personal, Maternity, Study leave
- ✅ **Leave Balances** - Automatic tracking of leave balances by type
- ✅ **Beautiful UI** - Modern, responsive design with shadcn/ui components
- ✅ **Real-time Updates** - Powered by Supabase real-time subscriptions
- ✅ **Role-based Access** - Secure data access with Row Level Security (RLS)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Validation**: Zod
- **Forms**: React Hook Form
- **Date Handling**: date-fns
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account ([sign up here](https://supabase.com))

## Getting Started

### 1. Clone the Repository

\`\`\`bash
git clone <your-repo-url>
cd genoeg-gewerk
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon key

### 4. Configure Environment Variables

Create a \`.env.local\` file in the root directory:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Update the values with your Supabase credentials:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
\`\`\`

### 5. Run Database Migrations

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy the contents of \`supabase/migrations/00001_initial_schema.sql\`
4. Paste and run the SQL script

This will create:
- All necessary tables (profiles, leave_types, leaves, leave_balances)
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic updates
- Initial leave type data

### 6. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
genoeg-gewerk/
├── app/                        # Next.js 14 App Router
│   ├── (auth)/                # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/           # Protected dashboard pages
│   │   ├── dashboard/
│   │   ├── my-leaves/
│   │   ├── request-leave/
│   │   └── team-calendar/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── auth/                  # Auth forms
│   ├── leaves/                # Leave components
│   ├── dashboard/             # Dashboard widgets
│   └── layout/                # Layout components
├── lib/
│   ├── supabase/             # Supabase client config
│   ├── services/             # Service layer (API calls)
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript types
│   └── utils/                # Utility functions
└── supabase/
    └── migrations/           # Database migrations
\`\`\`

## Usage

### Creating an Account

1. Navigate to the register page
2. Fill in your details (name, email, password, department)
3. Click "Create Account"
4. Sign in with your credentials

### Requesting Leave

1. Go to "Request Leave" from the dashboard
2. Select leave type (Annual, Sick, etc.)
3. Choose start and end dates
4. Add a reason (optional)
5. Submit the request

The system automatically calculates business days (excluding weekends).

### Viewing Team Calendar

1. Navigate to "Team Calendar"
2. See all approved leaves from your team
3. Filter by leave type, department, or date range

## Database Schema

### Tables

- **profiles** - User profile information
- **leave_types** - Types of leave available
- **leaves** - Leave requests and their status
- **leave_balances** - User leave balances by type and year

### Security

All tables have Row Level Security (RLS) enabled:
- Users can view all profiles (for team calendar)
- Users can only create/update/delete their own leave requests
- All users can view approved leaves (team visibility)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard:
   - \`NEXT_PUBLIC_SUPABASE_URL\`
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
4. Deploy!

The app will be live at your Vercel URL.

## Code Quality

This project follows strict code quality rules:

- ✅ **No file exceeds 500 lines** - All components are modular and focused
- ✅ **Service layer pattern** - Business logic separated from UI
- ✅ **Type safety** - Full TypeScript coverage
- ✅ **Component composition** - Reusable, composable components
- ✅ **Custom hooks** - Shared logic extracted into hooks

## Development Commands

\`\`\`bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Type checking
npm run type-check

# Linting
npm run lint
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js and Supabase**
