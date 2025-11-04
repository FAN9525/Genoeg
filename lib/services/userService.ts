// User service layer
'use client';

import { createClient } from '@/lib/supabase/client';
import type { User, UpdateUserInput } from '@/lib/types';

export const userService = {
  /**
   * Get user profile by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  },

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data;
  },

  /**
   * Get users by department
   */
  async getUsersByDepartment(department: string): Promise<User[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('department', department)
      .order('full_name');

    if (error) {
      console.error('Error fetching users by department:', error);
      return [];
    }

    return data;
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: UpdateUserInput): Promise<User | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      // @ts-ignore - Supabase generated types may need regeneration
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Get all departments
   */
  async getDepartments(): Promise<string[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('department')
      .not('department', 'is', null);

    if (error) {
      console.error('Error fetching departments:', error);
      return [];
    }

    // Get unique departments
    const departments = [...new Set(data.map((item: any) => item.department).filter(Boolean))];
    return departments as string[];
  },
};

