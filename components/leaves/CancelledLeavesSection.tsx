// Cancelled Leaves Section - Manage and cleanup cancelled leave history
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, AlertCircle, Loader2, Info } from 'lucide-react';
import { leaveService } from '@/lib/services/leaveService';
import { toast } from 'sonner';
import type { Leave } from '@/lib/types';
import { formatDate } from '@/lib/utils/dateUtils';

interface CancelledLeavesSectionProps {
  userId: string;
  onUpdate?: () => void;
}

export function CancelledLeavesSection({ userId, onUpdate }: CancelledLeavesSectionProps) {
  const [cancelledLeaves, setCancelledLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);

  useEffect(() => {
    loadCancelledLeaves();
  }, [userId]);

  const loadCancelledLeaves = async () => {
    try {
      setLoading(true);
      const data = await leaveService.getCancelledLeaves(userId);
      setCancelledLeaves(data);
    } catch (error) {
      console.error('Error loading cancelled leaves:', error);
      toast.error('Failed to load cancelled leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    if (!confirm('Permanently delete this cancelled leave? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(leaveId);
      await leaveService.permanentlyDeleteLeave(leaveId, userId);
      toast.success('Leave record permanently deleted');
      await loadCancelledLeaves();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting leave:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete leave');
    } finally {
      setDeleting(null);
    }
  };

  const handleCleanupAll = async () => {
    if (!confirm(`Permanently delete all ${cancelledLeaves.length} cancelled leaves? This action cannot be undone.`)) {
      return;
    }

    try {
      setCleaningUp(true);
      const result = await leaveService.cleanupAllCancelledLeaves(userId);
      const count = (result as any)?.[0]?.deleted_count || cancelledLeaves.length;
      toast.success(`Cleaned up ${count} cancelled leave(s)`);
      await loadCancelledLeaves();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error cleaning up leaves:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cleanup leaves');
    } finally {
      setCleaningUp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-muted-foreground" />
              Cancelled Leaves ({cancelledLeaves.length})
            </CardTitle>
            <CardDescription>
              View and manage your cancelled leave history
            </CardDescription>
          </div>
          {cancelledLeaves.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCleanupAll}
              disabled={cleaningUp}
            >
              {cleaningUp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cleaning up...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cleanup All ({cancelledLeaves.length})
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {cancelledLeaves.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Cancelled Leaves</AlertTitle>
            <AlertDescription>
              You don't have any cancelled leave requests in your history.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Permanent Deletion</AlertTitle>
              <AlertDescription className="text-sm">
                These leaves are already cancelled. You can permanently delete them to clean up your
                history. <strong>This action cannot be undone.</strong>
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Cancelled Date</TableHead>
                    <TableHead>Cancellation Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cancelledLeaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: leave.leave_type?.color }}
                          />
                          {leave.leave_type?.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {leave.total_days} {leave.total_days === 1 ? 'day' : 'days'}
                          {leave.is_half_day && (
                            <span className="ml-1 text-xs">
                              ({leave.half_day_period})
                            </span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(leave as any).cancelled_at
                          ? formatDate((leave as any).cancelled_at)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {(leave as any).cancellation_reason || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLeave(leave.id)}
                          disabled={deleting === leave.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deleting === leave.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

