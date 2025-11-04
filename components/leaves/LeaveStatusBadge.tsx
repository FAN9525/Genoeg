// Status badge component for leave requests
import { Badge } from '@/components/ui/badge';
import type { Leave } from '@/lib/types';

interface LeaveStatusBadgeProps {
  status: Leave['status'];
}

export function LeaveStatusBadge({ status }: LeaveStatusBadgeProps) {
  const variants: Record<Leave['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    approved: 'bg-green-100 text-green-800 hover:bg-green-100',
    rejected: 'bg-red-100 text-red-800 hover:bg-red-100',
    cancelled: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  };

  const labels: Record<Leave['status'], string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  };

  return (
    <Badge className={variants[status]} variant="outline">
      {labels[status]}
    </Badge>
  );
}

