// Admin service layer for user and system management
'use client';

import { createClient } from '@/lib/supabase/client';
import type { User, CreateUserInput } from '@/lib/types';

export interface CreateUserWithDatesInput extends CreateUserInput {
  start_work_date: string;
  end_work_date?: string;
  role?: 'employee' | 'manager' | 'admin';
}

export interface AdminUserStats {
  id: string;
  email: string;
  full_name: string;
  department: string | null;
  role: string;
  start_work_date: string | null;
  end_work_date: string | null;
  total_leaves: number;
  pending_leaves: number;
  total_balance: number;
  used_days: number;
  remaining_days: number;
}

export const adminService = {
  /**
   * Check if current user is admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    const supabase = createClient();

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    return data?.role === 'admin';
  },

  /**
   * Get all users with statistics (admin only)
   */
  async getAllUsersWithStats(): Promise<AdminUserStats[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('admin_user_stats')
      .select('*')
      .order('full_name');

    if (error) {
      console.error('Error fetching user stats:', error);
      return [];
    }

    return data as AdminUserStats[];
  },

  /**
   * Create a new user (admin only)
   */
  async createUser(input: CreateUserWithDatesInput): Promise<{ user: User; tempPassword: string }> {
    const supabase = createClient();

    // Generate temporary password
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: input.email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: input.full_name,
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Create profile with work dates
    // @ts-ignore - Supabase generated types may need regeneration
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: input.email,
        full_name: input.full_name,
        department: input.department || null,
        role: input.role || 'employee',
        start_work_date: input.start_work_date,
        end_work_date: input.end_work_date || null,
      } as any)
      .select()
      .single();

    if (profileError) {
      throw new Error(profileError.message);
    }

    return {
      user: profile,
      tempPassword,
    };
  },

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: 'employee' | 'manager' | 'admin'): Promise<void> {
    const supabase = createClient();

    // @ts-ignore - Supabase generated types may need regeneration
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Update user work dates (admin only)
   */
  async updateUserWorkDates(
    userId: string,
    startDate: string,
    endDate?: string
  ): Promise<void> {
    const supabase = createClient();

    // @ts-ignore - Supabase generated types may need regeneration
    const { error } = await supabase
      .from('profiles')
      .update({
        start_work_date: startDate,
        end_work_date: endDate || null,
      })
      .eq('id', userId);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Deactivate user (set end work date)
   */
  async deactivateUser(userId: string, endDate: string): Promise<void> {
    const supabase = createClient();

    // @ts-ignore - Supabase generated types may need regeneration
    const { error } = await supabase
      .from('profiles')
      .update({ end_work_date: endDate })
      .eq('id', userId);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Approve or reject a leave request (manager/admin only)
   */
  async updateLeaveStatus(
    leaveId: string,
    status: 'approved' | 'rejected',
    approverId: string
  ): Promise<void> {
    const supabase = createClient();

    // @ts-ignore - Supabase generated types may need regeneration
    const { error } = await supabase
      .from('leaves')
      .update({
        status,
        approved_by: approverId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', leaveId);

    if (error) {
      throw new Error(error.message);
    }

    // If approved, update leave balance
    if (status === 'approved') {
      await this.updateLeaveBalance(leaveId);
    }
  },

  /**
   * Update leave balance after approval
   */
  async updateLeaveBalance(leaveId: string): Promise<void> {
    const supabase = createClient();

    // Get leave details
    const { data: leave } = await supabase
      .from('leaves')
      .select('user_id, leave_type_id, total_days, start_date')
      .eq('id', leaveId)
      .single();

    if (!leave) return;

    const year = new Date(leave.start_date).getFullYear();

    // Update balance
    const { error } = await supabase.rpc('update_leave_balance', {
      p_user_id: leave.user_id,
      p_leave_type_id: leave.leave_type_id,
      p_year: year,
      p_days_used: leave.total_days,
    });

    if (error) {
      // If function doesn't exist, do manual update
      // @ts-ignore
      await supabase
        .from('leave_balances')
        .update({
          used_days: supabase.rpc('increment_used_days', { amount: leave.total_days }),
          remaining_days: supabase.rpc('decrement_remaining_days', { amount: leave.total_days }),
        })
        .eq('user_id', leave.user_id)
        .eq('leave_type_id', leave.leave_type_id)
        .eq('year', year);
    }
  },

  /**
   * Get all pending leave requests (manager/admin only)
   */
  async getPendingLeaves() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('leaves')
      .select(
        `
        *,
        user:profiles!leaves_user_id_fkey(*),
        leave_type:leave_types(*)
      `
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending leaves:', error);
      return [];
    }

    return data;
  },

  /**
   * Get system statistics (admin only)
   */
  async getSystemStats() {
    const supabase = createClient();

    const [usersResult, leavesResult, pendingResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('leaves').select('id', { count: 'exact', head: true }),
      supabase
        .from('leaves')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

    return {
      total_users: usersResult.count || 0,
      total_leaves: leavesResult.count || 0,
      pending_leaves: pendingResult.count || 0,
    };
  },
};

