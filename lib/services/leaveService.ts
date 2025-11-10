// Leave service layer for all leave-related operations
'use client';

import { createClient } from '@/lib/supabase/client';
import type {
  Leave,
  CreateLeaveInput,
  UpdateLeaveInput,
  LeaveFilters,
  LeaveBalance,
  LeaveType,
  UserLeaveStats,
} from '@/lib/types';
import { calculateBusinessDays, getCurrentYear } from '@/lib/utils/dateUtils';

export const leaveService = {
  /**
   * Create a new leave request
   */
  async createLeave(userId: string, input: CreateLeaveInput): Promise<Leave> {
    const supabase = createClient();

    // Calculate total days
    const total_days = calculateBusinessDays(input.start_date, input.end_date);

    const { data, error } = await supabase
      .from('leaves')
      .insert({
        user_id: userId,
        leave_type_id: input.leave_type_id,
        start_date: input.start_date,
        end_date: input.end_date,
        total_days,
        reason: input.reason || null,
        status: 'pending',
      } as any)
      .select(
        `
        *,
        user:profiles!leaves_user_id_fkey(*),
        leave_type:leave_types(*)
      `
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Update an existing leave request
   */
  async updateLeave(
    leaveId: string,
    userId: string,
    updates: UpdateLeaveInput
  ): Promise<Leave> {
    const supabase = createClient();

    // If dates are updated, recalculate total days
    let updateData: any = { ...updates };

    if (updates.start_date && updates.end_date) {
      updateData.total_days = calculateBusinessDays(updates.start_date, updates.end_date);
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('leaves')
      // @ts-ignore - Supabase generated types may need regeneration
      .update(updateData)
      .eq('id', leaveId)
      .eq('user_id', userId)
      .select(
        `
        *,
        user:profiles!leaves_user_id_fkey(*),
        leave_type:leave_types(*)
      `
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Cancel a leave request
   */
  async cancelLeave(leaveId: string, userId: string): Promise<Leave> {
    return this.updateLeave(leaveId, userId, { status: 'cancelled' });
  },

  /**
   * Delete a leave request (only for pending leaves)
   */
  async deleteLeave(leaveId: string, userId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('leaves')
      .delete()
      .eq('id', leaveId)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Get a single leave by ID
   */
  async getLeaveById(leaveId: string): Promise<Leave | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('leaves')
      .select(
        `
        *,
        user:profiles!leaves_user_id_fkey(*),
        leave_type:leave_types(*),
        approver:profiles!leaves_approved_by_fkey(*)
      `
      )
      .eq('id', leaveId)
      .single();

    if (error) {
      console.error('Error fetching leave:', error);
      return null;
    }

    return data;
  },

  /**
   * Get user's leave requests with filters
   */
  async getUserLeaves(userId: string, filters?: LeaveFilters): Promise<Leave[]> {
    const supabase = createClient();

    let query = supabase
      .from('leaves')
      .select(
        `
        *,
        user:profiles!leaves_user_id_fkey(*),
        leave_type:leave_types(*),
        approver:profiles!leaves_approved_by_fkey(*)
      `
      )
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    // Apply filters
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters?.leave_type_id) {
      query = query.eq('leave_type_id', filters.leave_type_id);
    }

    if (filters?.start_date) {
      query = query.gte('start_date', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('end_date', filters.end_date);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user leaves:', error);
      return [];
    }

    return data;
  },

  /**
   * Get all team leaves with filters
   */
  async getTeamLeaves(filters?: LeaveFilters): Promise<Leave[]> {
    const supabase = createClient();

    let query = supabase
      .from('leaves')
      .select(
        `
        *,
        user:profiles!leaves_user_id_fkey(*),
        leave_type:leave_types(*),
        approver:profiles!leaves_approved_by_fkey(*)
      `
      )
      .order('start_date', { ascending: false });

    // Apply filters
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.leave_type_id) {
      query = query.eq('leave_type_id', filters.leave_type_id);
    }

    if (filters?.start_date) {
      query = query.gte('start_date', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('end_date', filters.end_date);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching team leaves:', error);
      return [];
    }

    return data;
  },

  /**
   * Get user's leave statistics
   */
  async getUserLeaveStats(userId: string): Promise<UserLeaveStats> {
    const supabase = createClient();
    const currentDate = new Date().toISOString().split('T')[0];

    // Get ALL leave balances (cumulative total across all years/cycles)
    const { data: allBalances } = await supabase
      .from('leave_balances')
      .select('*, leave_type:leave_types(*)')
      .eq('user_id', userId)
      .order('year', { ascending: false });

    // Get ACTIVE leave balances for display (current year OR active cycles)
    const { data: activeBalances } = await supabase
      .from('leave_balances')
      .select('*, leave_type:leave_types(*)')
      .eq('user_id', userId)
      .or(`cycle_end_date.gte.${currentDate},cycle_end_date.is.null`);

    // Group all balances by leave type for cumulative view
    const balancesByTypeMap = new Map();
    allBalances?.forEach((balance: any) => {
      const typeId = balance.leave_type_id;
      const existing = balancesByTypeMap.get(typeId);
      
      if (existing) {
        existing.total_days += balance.total_days;
        existing.used_days += balance.used_days;
        existing.remaining_days += balance.remaining_days;
      } else {
        balancesByTypeMap.set(typeId, {
          id: typeId,
          leave_type_id: typeId,
          leave_type: balance.leave_type,
          total_days: balance.total_days,
          used_days: balance.used_days,
          remaining_days: balance.remaining_days,
        });
      }
    });

    const cumulativeBalancesByType = Array.from(balancesByTypeMap.values());

    // Get leave counts
    const { data: leaves } = await supabase
      .from('leaves')
      .select('status')
      .eq('user_id', userId);

    const stats: UserLeaveStats = {
      total_leaves: leaves?.length || 0,
      pending_leaves: leaves?.filter((l: any) => l.status === 'pending').length || 0,
      approved_leaves: leaves?.filter((l: any) => l.status === 'approved').length || 0,
      rejected_leaves: leaves?.filter((l: any) => l.status === 'rejected').length || 0,
      upcoming_leaves: 0,
      total_balance: allBalances?.reduce((sum: number, b: any) => sum + b.total_days, 0) || 0,
      used_days: allBalances?.reduce((sum: number, b: any) => sum + b.used_days, 0) || 0,
      remaining_days: allBalances?.reduce((sum: number, b: any) => sum + b.remaining_days, 0) || 0,
      balances_by_type: cumulativeBalancesByType,
      balances_by_year: allBalances || [],
    };

    // Calculate upcoming leaves
    const { data: upcomingLeaves } = await supabase
      .from('leaves')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .gte('start_date', currentDate);

    stats.upcoming_leaves = upcomingLeaves?.length || 0;

    return stats;
  },

  /**
   * Get all leave types
   */
  async getLeaveTypes(): Promise<LeaveType[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching leave types:', error);
      return [];
    }

    return data;
  },

  /**
   * Get user's leave balance
   */
  async getUserLeaveBalance(userId: string, year?: number): Promise<LeaveBalance[]> {
    const supabase = createClient();
    const targetYear = year || getCurrentYear();

    const { data, error } = await supabase
      .from('leave_balances')
      .select('*, leave_type:leave_types(*)')
      .eq('user_id', userId)
      .eq('year', targetYear);

    if (error) {
      console.error('Error fetching leave balance:', error);
      return [];
    }

    return data;
  },
};

