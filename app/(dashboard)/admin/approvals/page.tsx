// Leave approvals page for managers and admins
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { adminService } from '@/lib/services/adminService';
import { PendingLeavesTable } from '@/components/admin/PendingLeavesTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { Leave } from '@/lib/types';

export default function LeaveApprovalsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [canApprove, setCanApprove] = useState(false);

  const loadPendingLeaves = async () => {
    setLoading(true);
    const data = await adminService.getPendingLeaves();
    setLeaves(data);
    setLoading(false);
  };

  useEffect(() => {
    async function checkPermissionsAndLoad() {
      if (!user) return;

      // Check if user is admin or manager
      const isAdmin = await adminService.isAdmin(user.id);
      const isManager = user.role === 'manager' || user.role === 'admin';
      
      if (!isManager) {
        router.push('/dashboard');
        return;
      }

      setCanApprove(true);
      loadPendingLeaves();
    }

    checkPermissionsAndLoad();
  }, [user, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!canApprove) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Clock className="h-8 w-8" />
              Leave Approvals
            </h1>
            <p className="text-muted-foreground">
              Review and approve or reject pending leave requests
            </p>
          </div>
          <Button variant="outline" onClick={loadPendingLeaves}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests ({leaves.length})</CardTitle>
          <CardDescription>
            Approve or reject employee leave requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PendingLeavesTable 
            leaves={leaves} 
            currentUserId={user?.id || ''} 
            onUpdate={loadPendingLeaves}
          />
        </CardContent>
      </Card>
    </div>
  );
}

