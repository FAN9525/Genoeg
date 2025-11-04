// Authentication service layer
'use client';

import { createClient } from '@/lib/supabase/client';
import type { User } from '@/lib/types';

export const authService = {
  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string, full_name: string, department?: string) {
    const supabase = createClient();

    // Sign up user - profile will be created automatically by database trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          department,
        },
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    // Profile is automatically created by the on_auth_user_created trigger
    // No need to manually insert into profiles table
    
    return authData;
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Get the current user
   */
  async getCurrentUser(): Promise<User | null> {
    const supabase = createClient();

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      // If there's an auth error (403, 401, etc.), clear the session
      if (authError) {
        // Silently clear invalid session
        await supabase.auth.signOut();
        return null;
      }

      if (!authUser) {
        return null;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // If profile doesn't exist, return null (don't throw error)
      if (profileError) {
        console.warn('Profile not found for user:', authUser.id);
        return null;
      }

      return profile;
    } catch (error) {
      // Handle any unexpected errors gracefully
      console.error('Error in getCurrentUser:', error);
      // Clear potentially bad session
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore errors during cleanup
      }
      return null;
    }
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  },
};

