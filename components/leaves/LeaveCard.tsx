// Leave card component to display individual leave request
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CancelLeaveDialog } from './CancelLeaveDialog';
import { LeaveStatusBadge } from './LeaveStatusBadge';
import { formatDateRange } from '@/lib/utils/dateUtils';
import type { Leave } from '@/lib/types';
import { Calendar, User, FileText } from 'lucide-react';

interface LeaveCardProps {
  leave: Leave;
  userId?: string;
  onCancel?: () => void;
  showUser?: boolean;
}

export function LeaveCard({ leave, userId, onCancel, showUser = false }: LeaveCardProps) {
  const canCancel = (leave.status === 'pending' || leave.status === 'approved') && userId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {leave.leave_type?.name || 'Leave Request'}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateRange(leave.start_date, leave.end_date)}
            </CardDescription>
          </div>
          <LeaveStatusBadge status={leave.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {showUser && leave.user && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{leave.user.full_name}</span>
            {leave.user.department && (
              <span className="text-muted-foreground">• {leave.user.department}</span>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {leave.total_days} {leave.total_days === 1 ? 'day' : 'days'}
            {leave.is_half_day && (
              <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {leave.half_day_period === 'morning' ? '🌅 Morning' : '🌆 Afternoon'}
                {' '}(08h00-{leave.half_day_period === 'morning' ? '12h00' : '16h30'})
              </span>
            )}
          </span>
        </div>

        {leave.reason && (
          <div className="mt-3 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Reason:</p>
            <p>{leave.reason}</p>
          </div>
        )}

        {/* Show cancellation reason if leave was cancelled */}
        {leave.status === 'cancelled' && (leave as any).cancellation_reason && (
          <div className="mt-3 text-sm text-red-700 bg-red-50 p-3 rounded">
            <p className="font-medium mb-1">Cancellation Reason:</p>
            <p>{(leave as any).cancellation_reason}</p>
          </div>
        )}

        {canCancel && (
          <div className="mt-4 pt-4 border-t">
            <CancelLeaveDialog 
              leave={leave} 
              userId={userId} 
              onSuccess={onCancel}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

