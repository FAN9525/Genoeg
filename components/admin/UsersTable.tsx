// Users table for admin panel
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminService, type AdminUserStats } from '@/lib/services/adminService';
import { formatDate } from '@/lib/utils/dateUtils';
import { Shield, User as UserIcon, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface UsersTableProps {
  users: AdminUserStats[];
  onUpdate?: () => void;
}

export function UsersTable({ users, onUpdate }: UsersTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: 'employee' | 'manager' | 'admin') => {
    try {
      setUpdating(userId);
      await adminService.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to update user role');
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 hover:bg-red-100',
      manager: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      employee: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    };

    const icons: Record<string, React.ReactNode> = {
      admin: <Shield className="h-3 w-3 mr-1" />,
      manager: <Users className="h-3 w-3 mr-1" />,
      employee: <UserIcon className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge className={variants[role]} variant="outline">
        {icons[role]}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (endDate: string | null) => {
    if (!endDate) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100" variant="outline">
          Active
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100" variant="outline">
        Inactive
      </Badge>
    );
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead className="text-right">Leave Stats</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
              <TableCell>{user.department || '-'}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value) =>
                    handleRoleChange(user.id, value as 'employee' | 'manager' | 'admin')
                  }
                  disabled={updating === user.id}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">
                      <div className="flex items-center">
                        <UserIcon className="h-3 w-3 mr-2" />
                        Employee
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-2" />
                        Manager
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center">
                        <Shield className="h-3 w-3 mr-2" />
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>{getStatusBadge(user.end_work_date)}</TableCell>
              <TableCell>
                {user.start_work_date ? (
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {formatDate(user.start_work_date, 'MMM d, yyyy')}
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-medium">{user.total_balance} days</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Used: </span>
                    <span className="font-medium">{user.used_days} days</span>
                  </div>
                  {user.pending_leaves > 0 && (
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {user.pending_leaves} pending
                      </Badge>
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

