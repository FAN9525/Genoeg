// Custom hook for team calendar and leave data
'use client';

import { useEffect, useState } from 'react';
import { leaveService } from '@/lib/services/leaveService';
import type { Leave, LeaveFilters } from '@/lib/types';

export function useTeamCalendar(filters?: LeaveFilters) {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamLeaves = async () => {
    try {
      setLoading(true);
      // Default to showing only approved leaves
      const defaultFilters: LeaveFilters = {
        status: 'approved',
        ...filters,
      };
      const data = await leaveService.getTeamLeaves(defaultFilters);
      setLeaves(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch team leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamLeaves();
  }, [JSON.stringify(filters)]);

  return {
    leaves,
    loading,
    error,
    refresh: fetchTeamLeaves,
  };
}

