// My leaves page - view all personal leave requests
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLeaves } from '@/lib/hooks/useLeaves';
import { LeaveCard } from '@/components/leaves/LeaveCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { Leave } from '@/lib/types';
import { PlusCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function MyLeavesPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<Leave['status'] | 'all'>('all');
  
  const filters = statusFilter === 'all' ? undefined : { status: statusFilter };
  const { leaves, loading, cancelLeave } = useLeaves(user?.id || '', filters);

  const handleCancelLeave = async (leaveId: string) => {
    try {
      await cancelLeave(leaveId);
      toast.success('Leave request cancelled');
    } catch (error) {
      toast.error('Failed to cancel leave request');
    }
  };

  const pendingLeaves = leaves.filter((l) => l.status === 'pending');
  const approvedLeaves = leaves.filter((l) => l.status === 'approved');
  const rejectedLeaves = leaves.filter((l) => l.status === 'rejected');
  const cancelledLeaves = leaves.filter((l) => l.status === 'cancelled');

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Leaves</h1>
          <p className="text-muted-foreground">
            View and manage your leave requests
          </p>
        </div>
        <Button asChild>
          <Link href="/request-leave">
            <PlusCircle className="h-4 w-4 mr-2" />
            Request Leave
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({leaves.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingLeaves.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedLeaves.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedLeaves.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {leaves.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No leave requests</h3>
              <p className="text-muted-foreground mb-4">
                You haven't submitted any leave requests yet
              </p>
              <Button asChild>
                <Link href="/request-leave">Submit Your First Request</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {leaves.map((leave) => (
                <LeaveCard
                  key={leave.id}
                  leave={leave}
                  onCancel={handleCancelLeave}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingLeaves.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingLeaves.map((leave) => (
                <LeaveCard
                  key={leave.id}
                  leave={leave}
                  onCancel={handleCancelLeave}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedLeaves.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">No approved requests</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {approvedLeaves.map((leave) => (
                <LeaveCard key={leave.id} leave={leave} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedLeaves.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">No rejected requests</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rejectedLeaves.map((leave) => (
                <LeaveCard key={leave.id} leave={leave} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

