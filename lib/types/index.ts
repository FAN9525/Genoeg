// Core type definitions for Genoeg Gewerk Leave Management System

export interface User {
  id: string;
  email: string;
  full_name: string;
  department: string | null;
  role: 'employee' | 'manager' | 'admin';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  color: string;
  max_days_per_year: number;
  created_at: string;
}

export interface Leave {
  id: string;
  user_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: User;
  leave_type?: LeaveType;
  approver?: User;
}

export interface LeaveBalance {
  id: string;
  user_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  created_at: string;
  updated_at: string;
  leave_type?: LeaveType;
}

// Input types for creating/updating data
export interface CreateLeaveInput {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface UpdateLeaveInput {
  start_date?: string;
  end_date?: string;
  reason?: string;
  status?: Leave['status'];
}

export interface LeaveFilters {
  status?: Leave['status'] | Leave['status'][];
  start_date?: string;
  end_date?: string;
  leave_type_id?: string;
  user_id?: string;
  department?: string;
}

export interface TeamLeaveFilters extends LeaveFilters {
  department?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  department?: string;
}

export interface UpdateUserInput {
  full_name?: string;
  department?: string;
  avatar_url?: string;
}

// Stats and analytics types
export interface LeaveStats {
  total_leaves: number;
  pending_leaves: number;
  approved_leaves: number;
  rejected_leaves: number;
  upcoming_leaves: number;
}

export interface UserLeaveStats extends LeaveStats {
  total_balance: number;
  used_days: number;
  remaining_days: number;
  balances_by_type: LeaveBalance[];
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

