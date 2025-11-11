// Admin Forfeiture Dashboard - View all employees with pending forfeiture
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { adminService } from '@/lib/services/adminService';
import { leaveService } from '@/lib/services/leaveService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ArrowLeft, Info, Mail } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/dateUtils';

interface EmployeeWithForfeiture {
  user_id: string;
  full_name: string;
  email: string;
  forfeiture_acknowledgment_required: boolean;
  last_leave_forfeiture_date: string | null;
  year: number;
  days_subject_to_forfeiture: number;
  forfeiture_reason: string;
  forfeiture_due_date: string;
}

export default function AdminForfeituresPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeWithForfeiture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminAndLoad() {
      if (!user) return;

      const isAdmin = await adminService.isAdmin(user.id);
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }

      loadEmployeesWithForfeiture();
    }

    checkAdminAndLoad();
  }, [user, router]);

  const loadEmployeesWithForfeiture = async () => {
    try {
      setLoading(true);
      const data = await leaveService.getEmployeesWithPendingForfeiture();
      setEmployees(data as any); // Cast to any - data comes from view with exact fields needed
    } catch (error) {
      console.error('Error loading employees with forfeiture:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group employees by user
  const employeeGroups = employees.reduce((groups: Map<string, EmployeeWithForfeiture[]>, emp) => {
    const existing = groups.get(emp.user_id) || [];
    existing.push(emp);
    groups.set(emp.user_id, existing);
    return groups;
  }, new Map());

  const employeesWithTotals = Array.from(employeeGroups.entries()).map(([userId, records]) => {
    const totalDays = records.reduce((sum: number, r: EmployeeWithForfeiture) => sum + r.days_subject_to_forfeiture, 0);
    const yearsAffected = records.length;
    const employee = records[0];
    
    return {
      userId,
      fullName: employee.full_name,
      email: employee.email,
      totalDays,
      yearsAffected,
      requiresAcknowledgment: employee.forfeiture_acknowledgment_required,
      lastProcessed: employee.last_leave_forfeiture_date,
      records,
    };
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
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
              <AlertTriangle className="h-8 w-8 text-red-600" />
              Leave Forfeiture Management
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage employees with pending leave forfeiture (18-month rule)
            </p>
          </div>
        </div>
      </div>

      {/* Summary Alert */}
      {employeesWithTotals.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Forfeiture Required for {employeesWithTotals.length} Employee(s)</AlertTitle>
          <AlertDescription>
            These employees have unused annual leave that has exceeded the 18-month legal limit.
            They must acknowledge and process the forfeiture in their profile.
          </AlertDescription>
        </Alert>
      )}

      {/* Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>18-Month Forfeiture Rule (BCEA)</AlertTitle>
        <AlertDescription className="text-sm space-y-2">
          <p>
            Under the <strong>Basic Conditions of Employment Act (BCEA)</strong> and case law{' '}
            (<em>Ludick v Rural Maintenance</em>):
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>12 months: Annual leave cycle (Jan 1 - Dec 31)</li>
            <li>+ 6 months: Carry-over period (until June 30 of following year)</li>
            <li>= 18 months total: Maximum time before forfeiture</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employees with Pending Forfeiture ({employeesWithTotals.length})</CardTitle>
          <CardDescription>
            Each employee must acknowledge the forfeiture in their My Schedule page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employeesWithTotals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <p className="text-lg font-semibold">No Pending Forfeitures</p>
              <p className="text-sm mt-2">All employees are compliant with the 18-month rule.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Years Affected</TableHead>
                    <TableHead className="text-center">Total Days</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Last Processed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeesWithTotals.map((emp) => (
                    <TableRow key={emp.userId}>
                      <TableCell className="font-medium">{emp.fullName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {emp.email}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{emp.yearsAffected} years</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="destructive" className="font-bold">
                          {emp.totalDays} days
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {emp.requiresAcknowledgment ? (
                          <Badge variant="destructive">Acknowledgment Required</Badge>
                        ) : (
                          <Badge variant="outline">Pending User Action</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {emp.lastProcessed
                          ? formatDate(emp.lastProcessed, 'MMM d, yyyy')
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Send email notification (placeholder)
                            alert(`Email notification would be sent to ${emp.email}`);
                          }}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Notify
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      {employeesWithTotals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Breakdown by Employee</CardTitle>
            <CardDescription>
              See which specific years are affected for each employee
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {employeesWithTotals.map((emp) => (
              <div key={emp.userId} className="border rounded-lg p-4">
                <div className="font-semibold text-lg mb-3">
                  {emp.fullName} - Total: {emp.totalDays} days
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Days to Forfeit</TableHead>
                      <TableHead>Forfeiture Due Date</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emp.records.map((record: EmployeeWithForfeiture) => (
                      <TableRow key={`${emp.userId}-${record.year}`}>
                        <TableCell className="font-medium">{record.year}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {record.days_subject_to_forfeiture} days
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(record.forfeiture_due_date, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-md">
                          {record.forfeiture_reason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

