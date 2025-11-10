// Work schedule service for 4-day workweek management
'use client';

import { createClient } from '@/lib/supabase/client';

export interface WorkSchedulePattern {
  id: string;
  name: string;
  description: string | null;
  days_per_week: number;
  effective_from: string;
  effective_until: string | null;
  is_active: boolean;
}

export interface WorkSchedule {
  id: string;
  user_id: string;
  pattern_id: string | null;
  week_start_date: string;
  monday_off: boolean;
  tuesday_off: boolean;
  wednesday_off: boolean;
  thursday_off: boolean;
  friday_off: boolean;
  notes: string | null;
}

export interface ScheduleDay {
  week_start: string;
  day_of_week: string;
  is_off: boolean;
  date: string;
}

export const scheduleService = {
  /**
   * Get all schedule patterns
   */
  async getSchedulePatterns(): Promise<WorkSchedulePattern[]> {
    const supabase = createClient();

    // @ts-ignore - Table types not yet generated
    const { data, error } = await supabase
      .from('work_schedule_patterns')
      .select('*')
      .order('effective_from', { ascending: false });

    if (error) {
      console.error('Error fetching schedule patterns:', error);
      return [];
    }

    return data;
  },

  /**
   * Generate rotating schedule for a department
   */
  async generateRotatingSchedule(
    department: string,
    startDate: string,
    weeks: number = 12
  ): Promise<any> {
    const supabase = createClient();

    // @ts-ignore - RPC function types not yet generated
    const { data, error } = await supabase.rpc('generate_rotating_schedule', {
      p_department: department,
      p_start_date: startDate,
      p_weeks: weeks,
    });

    if (error) {
      console.error('Error generating schedule:', error);
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Apply rotating schedule to database
   */
  async applyRotatingSchedule(
    department: string,
    startDate: string,
    weeks: number = 12
  ): Promise<number> {
    const supabase = createClient();

    // @ts-ignore - RPC function types not yet generated
    const { data, error } = await supabase.rpc('apply_rotating_schedule', {
      p_department: department,
      p_start_date: startDate,
      p_weeks: weeks,
    });

    if (error) {
      console.error('Error applying schedule:', error);
      throw new Error(error.message);
    }

    return data || 0;
  },

  /**
   * Get user's schedule for a date range
   */
  async getUserSchedule(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ScheduleDay[]> {
    const supabase = createClient();

    // @ts-ignore - RPC function types not yet generated
    const { data, error } = await supabase.rpc('get_user_schedule', {
      p_user_id: userId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      console.error('Error fetching user schedule:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get all schedules for a week
   */
  async getWeekSchedules(weekStartDate: string): Promise<WorkSchedule[]> {
    const supabase = createClient();

    // @ts-ignore - Table types not yet generated
    const { data, error } = await supabase
      .from('work_schedules')
      .select('*, user:profiles(full_name, email, department)')
      .eq('week_start_date', weekStartDate)
      .order('user.full_name');

    if (error) {
      console.error('Error fetching week schedules:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Check if a date is a scheduled work day for user
   */
  async isScheduledWorkDay(userId: string, date: string): Promise<boolean> {
    const supabase = createClient();

    // @ts-ignore - RPC function types not yet generated
    const { data, error } = await supabase.rpc('is_scheduled_work_day', {
      p_user_id: userId,
      p_date: date,
    });

    if (error) {
      console.error('Error checking work day:', error);
      return true; // Default to true if error
    }

    return data || true;
  },

  /**
   * Update individual schedule
   */
  async updateSchedule(
    scheduleId: string,
    updates: Partial<WorkSchedule>
  ): Promise<void> {
    const supabase = createClient();

    // @ts-ignore - Table types not yet generated
    const { error } = await supabase
      .from('work_schedules')
      // @ts-ignore
      .update(updates)
      .eq('id', scheduleId);

    if (error) {
      throw new Error(error.message);
    }
  },
};

