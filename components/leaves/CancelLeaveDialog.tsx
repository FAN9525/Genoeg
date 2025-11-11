// Cancel Leave Dialog - Allow users to cancel pending or approved leave with reason
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, X, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { leaveService } from '@/lib/services/leaveService';
import { toast } from 'sonner';
import type { Leave } from '@/lib/types';
import { formatDateRange } from '@/lib/utils/dateUtils';

interface CancelLeaveDialogProps {
  leave: Leave;
  userId: string;
  onSuccess?: () => void;
}

export function CancelLeaveDialog({ leave, userId, onSuccess }: CancelLeaveDialogProps) {
  const [open, setOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [loading, setLoading] = useState(false);

  const isApproved = leave.status === 'approved';
  const isPending = leave.status === 'pending';

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      setLoading(true);
      await leaveService.cancelLeaveWithReason(leave.id, userId, cancellationReason);
      
      toast.success('Leave cancelled successfully', {
        description: isApproved 
          ? `${leave.total_days} days have been restored to your balance`
          : 'Your pending request has been cancelled',
      });

      setOpen(false);
      setCancellationReason('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error cancelling leave:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel leave');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel {isApproved ? 'Approved' : ''} Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Cancel Leave Request
          </DialogTitle>
          <DialogDescription>
            Provide a reason for cancelling this {isApproved ? 'approved' : 'pending'} leave request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Leave Details */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div>
              <span className="text-sm font-semibold">Leave Type:</span>
              <span className="text-sm ml-2">{leave.leave_type?.name}</span>
            </div>
            <div>
              <span className="text-sm font-semibold">Dates:</span>
              <span className="text-sm ml-2">{formatDateRange(leave.start_date, leave.end_date)}</span>
            </div>
            <div>
              <span className="text-sm font-semibold">Days:</span>
              <span className="text-sm ml-2">{leave.total_days} days</span>
            </div>
            {leave.reason && (
              <div>
                <span className="text-sm font-semibold">Original Reason:</span>
                <p className="text-sm mt-1 text-muted-foreground">{leave.reason}</p>
              </div>
            )}
          </div>

          {/* Warning for Approved Leaves */}
          {isApproved && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Cancelling Approved Leave</AlertTitle>
              <AlertDescription className="text-sm">
                This leave has been approved. Cancelling it will restore {leave.total_days} days to your leave balance.
              </AlertDescription>
            </Alert>
          )}

          {/* Cancellation Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="cancellation-reason">
              Reason for Cancellation <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="cancellation-reason"
              placeholder="Please explain why you need to cancel this leave request..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              A reason is required to cancel {isApproved ? 'approved' : ''} leave requests
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setCancellationReason('');
              }}
              className="flex-1"
              disabled={loading}
            >
              Keep Leave
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              className="flex-1"
              disabled={loading || !cancellationReason.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Leave
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

