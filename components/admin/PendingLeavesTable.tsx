// Pending leaves approval table for managers/admins
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminService } from '@/lib/services/adminService';
import { formatDateRange } from '@/lib/utils/dateUtils';
import type { Leave } from '@/lib/types';
import { CheckCircle, XCircle, Calendar, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PendingLeavesTableProps {
  leaves: Leave[];
  currentUserId: string;
  onUpdate?: () => void;
}

export function PendingLeavesTable({ leaves, currentUserId, onUpdate }: PendingLeavesTableProps) {
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApprove = async (leaveId: string) => {
    try {
      setProcessing(leaveId);
      await adminService.updateLeaveStatus(leaveId, 'approved', currentUserId);
      toast.success('Leave request approved');
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to approve leave request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (leaveId: string) => {
    try {
      setProcessing(leaveId);
      await adminService.updateLeaveStatus(leaveId, 'rejected', currentUserId);
      toast.success('Leave request rejected');
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to reject leave request');
    } finally {
      setProcessing(null);
    }
  };

  if (leaves.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/50">
        <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
        <p className="text-muted-foreground">All leave requests have been processed</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Leave Type</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaves.map((leave) => (
            <TableRow key={leave.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{leave.user?.full_name}</span>
                </div>
              </TableCell>
              <TableCell>{leave.user?.department || '-'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: leave.leave_type?.color }}
                  />
                  {leave.leave_type?.name}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {formatDateRange(leave.start_date, leave.end_date)}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{leave.total_days} days</Badge>
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="text-sm text-muted-foreground truncate">
                  {leave.reason || '-'}
                </p>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => handleApprove(leave.id)}
                    disabled={processing === leave.id}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleReject(leave.id)}
                    disabled={processing === leave.id}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

