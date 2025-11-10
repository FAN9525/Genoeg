// Dashboard page - overview of leave statistics
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { leaveService } from '@/lib/services/leaveService';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { LeaveCard } from '@/components/leaves/LeaveCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserLeaveStats, Leave } from '@/lib/types';
import { Calendar, Clock, CheckCircle, XCircle, Briefcase } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserLeaveStats | null>(null);
  const [recentLeaves, setRecentLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;

      try {
        setLoading(true);
        const [statsData, leavesData] = await Promise.all([
          leaveService.getUserLeaveStats(user.id),
          leaveService.getUserLeaves(user.id),
        ]);
        
        setStats(statsData);
        setRecentLeaves(leavesData.slice(0, 5)); // Get 5 most recent
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.full_name?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your leave status
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Balance"
          value={stats?.total_balance || 0}
          description="days available since start date"
          icon={Calendar}
        />
        <StatsCard
          title="Used Days"
          value={stats?.used_days || 0}
          description="days taken"
          icon={Briefcase}
        />
        <StatsCard
          title="Remaining"
          value={stats?.remaining_days || 0}
          description="days left"
          icon={Clock}
        />
        <StatsCard
          title="Pending"
          value={stats?.pending_leaves || 0}
          description="requests awaiting approval"
          icon={XCircle}
        />
      </div>

      {/* Leave Balance by Type - Cumulative */}
      {stats && stats.balances_by_type.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Leave Balance by Type (Cumulative)</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.balances_by_type.map((balance) => (
              <div
                key={balance.id}
                className="p-4 rounded-lg border bg-card text-card-foreground"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: balance.leave_type?.color }}
                  />
                  <h3 className="font-semibold">{balance.leave_type?.name}</h3>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Available</p>
                    <p className="font-bold text-lg">{balance.total_days}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Taken</p>
                    <p className="font-bold text-lg">{balance.used_days}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Balance</p>
                    <p className="font-bold text-lg text-primary">{balance.remaining_days}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yearly Breakdown */}
      {stats && stats.balances_by_year && stats.balances_by_year.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Yearly Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Year</th>
                  <th className="text-left p-3 font-semibold">Leave Type</th>
                  <th className="text-right p-3 font-semibold">Available</th>
                  <th className="text-right p-3 font-semibold">Taken</th>
                  <th className="text-right p-3 font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {stats.balances_by_year.map((balance, index) => (
                  <tr key={`${balance.year}-${balance.leave_type_id}`} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                    <td className="p-3">{balance.year}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: balance.leave_type?.color }}
                        />
                        {balance.leave_type?.name}
                      </div>
                    </td>
                    <td className="p-3 text-right">{balance.total_days}</td>
                    <td className="p-3 text-right">{balance.used_days}</td>
                    <td className="p-3 text-right font-semibold text-primary">{balance.remaining_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Leaves */}
      {recentLeaves.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Leave Requests</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {recentLeaves.map((leave) => (
              <LeaveCard key={leave.id} leave={leave} />
            ))}
          </div>
        </div>
      )}

      {recentLeaves.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No leave requests yet</h3>
          <p className="text-muted-foreground">
            Get started by submitting your first leave request
          </p>
        </div>
      )}
    </div>
  );
}

