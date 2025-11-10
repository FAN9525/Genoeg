// Admin service layer for user and system management
'use client';

import { createClient } from '@/lib/supabase/client';
import type { User, CreateUserInput } from '@/lib/types';

export interface CreateUserWithDatesInput {
  email: string;
  full_name: string;
  department?: string;
  password?: string;
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

    return (data as any)?.role === 'admin';
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
   * Create a new user (admin only) - Uses server-side API
   */
  async createUser(input: CreateUserWithDatesInput): Promise<{ user: any; tempPassword: string }> {
    // Call server-side API route (has service role access)
    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }

    const data = await response.json();
    return {
      user: data.user,
      tempPassword: data.tempPassword,
    };
  },

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: 'employee' | 'manager' | 'admin'): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('profiles')
      // @ts-ignore - Supabase generated types may need regeneration
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

    const { error } = await supabase
      .from('profiles')
      // @ts-ignore - Supabase generated types may need regeneration
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

    const { error } = await supabase
      .from('profiles')
      // @ts-ignore - Supabase generated types may need regeneration
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

    const { error } = await supabase
      .from('leaves')
      // @ts-ignore - Supabase generated types may need regeneration
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

    const leaveData = leave as any;
    const year = new Date(leaveData.start_date).getFullYear();

    // Update balance using the database function
    // @ts-ignore - Supabase RPC types may need regeneration
    const { error } = await supabase.rpc('update_leave_balance', {
      p_user_id: leaveData.user_id,
      p_leave_type_id: leaveData.leave_type_id,
      p_year: year,
      p_days_used: leaveData.total_days,
    });

    if (error) {
      console.error('Error updating leave balance:', error);
      throw new Error(error.message);
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

    // Cast to Leave[] since we know status is 'pending' from the filter
    return data as any;
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

