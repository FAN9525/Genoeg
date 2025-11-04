// Custom hook for leave operations
'use client';

import { useEffect, useState } from 'react';
import { leaveService } from '@/lib/services/leaveService';
import type { Leave, LeaveFilters, CreateLeaveInput, UpdateLeaveInput } from '@/lib/types';

export function useLeaves(userId: string, filters?: LeaveFilters) {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const data = await leaveService.getUserLeaves(userId, filters);
      setLeaves(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchLeaves();
    }
  }, [userId, JSON.stringify(filters)]);

  const createLeave = async (input: CreateLeaveInput) => {
    const newLeave = await leaveService.createLeave(userId, input);
    await fetchLeaves();
    return newLeave;
  };

  const updateLeave = async (leaveId: string, updates: UpdateLeaveInput) => {
    const updatedLeave = await leaveService.updateLeave(leaveId, userId, updates);
    await fetchLeaves();
    return updatedLeave;
  };

  const cancelLeave = async (leaveId: string) => {
    await leaveService.cancelLeave(leaveId, userId);
    await fetchLeaves();
  };

  const deleteLeave = async (leaveId: string) => {
    await leaveService.deleteLeave(leaveId, userId);
    await fetchLeaves();
  };

  return {
    leaves,
    loading,
    error,
    refresh: fetchLeaves,
    createLeave,
    updateLeave,
    cancelLeave,
    deleteLeave,
  };
}

