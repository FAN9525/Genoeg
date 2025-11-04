// Admin dashboard page
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { adminService } from '@/lib/services/adminService';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FileText, Clock, Shield } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminAndLoadStats() {
      if (!user) return;

      // Check if user is admin
      const isAdmin = await adminService.isAdmin(user.id);
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }

      // Load stats
      const systemStats = await adminService.getSystemStats();
      setStats(systemStats);
      setLoading(false);
    }

    checkAdminAndLoadStats();
  }, [user, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          System overview and management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Users"
          value={stats?.total_users || 0}
          description="registered in the system"
          icon={Users}
        />
        <StatsCard
          title="Total Leave Requests"
          value={stats?.total_leaves || 0}
          description="all time requests"
          icon={FileText}
        />
        <StatsCard
          title="Pending Approvals"
          value={stats?.pending_leaves || 0}
          description="awaiting your review"
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div
          className="p-6 border rounded-lg hover:bg-accent cursor-pointer transition"
          onClick={() => router.push('/admin/users')}
        >
          <Users className="h-8 w-8 mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">User Management</h3>
          <p className="text-sm text-muted-foreground">
            Create new users, assign roles, and manage employee information
          </p>
        </div>

        <div
          className="p-6 border rounded-lg hover:bg-accent cursor-pointer transition"
          onClick={() => router.push('/admin/approvals')}
        >
          <Clock className="h-8 w-8 mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Leave Approvals</h3>
          <p className="text-sm text-muted-foreground">
            Review and approve or reject pending leave requests
          </p>
        </div>
      </div>
    </div>
  );
}

