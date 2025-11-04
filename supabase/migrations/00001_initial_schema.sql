-- Initial database schema for Genoeg Gewerk Leave Management System
-- Run this migration in your Supabase SQL editor

-- ============================================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with additional user information
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LEAVE TYPES TABLE
-- Defines different types of leave available (Annual, Sick, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  max_days_per_year INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LEAVES TABLE
-- Stores all leave requests with their status and details
-- ============================================================================
CREATE TABLE IF NOT EXISTS leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LEAVE BALANCES TABLE
-- Tracks leave balances for each user per leave type per year
-- ============================================================================
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  year INTEGER NOT NULL,
  total_days INTEGER NOT NULL,
  used_days INTEGER DEFAULT 0,
  remaining_days INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, leave_type_id, year)
);

-- ============================================================================
-- INDEXES
-- Create indexes for better query performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_leaves_user_id ON leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);
CREATE INDEX IF NOT EXISTS idx_leaves_dates ON leaves(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_balances_user ON leave_balances(user_id, year);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - PROFILES
-- ============================================================================

-- Everyone can view all profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (during registration)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- RLS POLICIES - LEAVES
-- ============================================================================

-- Everyone can view all leaves (for team calendar)
CREATE POLICY "Leaves are viewable by everyone"
  ON leaves FOR SELECT
  USING (true);

-- Users can create their own leaves
CREATE POLICY "Users can create their own leaves"
  ON leaves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending leaves
CREATE POLICY "Users can update their own pending leaves"
  ON leaves FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own pending leaves
CREATE POLICY "Users can delete their own pending leaves"
  ON leaves FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- ============================================================================
-- RLS POLICIES - LEAVE TYPES
-- ============================================================================

-- Everyone can view leave types
CREATE POLICY "Leave types are viewable by everyone"
  ON leave_types FOR SELECT
  USING (true);

-- ============================================================================
-- RLS POLICIES - LEAVE BALANCES
-- ============================================================================

-- Everyone can view leave balances
CREATE POLICY "Leave balances are viewable by everyone"
  ON leave_balances FOR SELECT
  USING (true);

-- ============================================================================
-- INITIAL DATA - LEAVE TYPES
-- Insert default leave types
-- ============================================================================
INSERT INTO leave_types (name, description, color, max_days_per_year) VALUES
  ('Annual Leave', 'Paid annual vacation leave', '#3B82F6', 20),
  ('Sick Leave', 'Leave for illness or medical appointments', '#EF4444', 10),
  ('Personal Leave', 'Personal or family emergencies', '#F59E0B', 5),
  ('Maternity Leave', 'Maternity or parental leave', '#EC4899', 90),
  ('Study Leave', 'Leave for educational purposes', '#8B5CF6', 5)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUNCTIONS
-- Function to automatically create leave balance for new users
-- ============================================================================
CREATE OR REPLACE FUNCTION create_initial_leave_balances()
RETURNS TRIGGER AS $$
DECLARE
  leave_type RECORD;
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  -- Create a leave balance for each leave type for the new user
  FOR leave_type IN SELECT * FROM leave_types LOOP
    INSERT INTO leave_balances (user_id, leave_type_id, year, total_days, used_days, remaining_days)
    VALUES (NEW.id, leave_type.id, current_year, leave_type.max_days_per_year, 0, leave_type.max_days_per_year);
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create leave balances when a new profile is created
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_leave_balances();

-- ============================================================================
-- UPDATED_AT TRIGGER
-- Function to automatically update the updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaves_updated_at
  BEFORE UPDATE ON leaves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

