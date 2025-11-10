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

      // If there's an auth error (403, 401, etc.), just return null
      // Don't try to sign out as that will also fail with 403
      if (authError) {
        // Just return null silently - the session is already invalid
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
        return null;
      }

      return profile as User;
    } catch (error) {
      // Handle any unexpected errors gracefully
      // Just return null, don't try to sign out
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

