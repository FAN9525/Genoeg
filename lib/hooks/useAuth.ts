// Custom hook for authentication
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/authService';
import type { User } from '@/lib/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await authService.signIn(email, password);
    const user = await authService.getCurrentUser();
    setUser(user);
    router.push('/dashboard');
    return data;
  };

  const signUp = async (
    email: string,
    password: string,
    full_name: string,
    department?: string
  ) => {
    const data = await authService.signUp(email, password, full_name, department);
    router.push('/login');
    return data;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    router.push('/login');
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
}

