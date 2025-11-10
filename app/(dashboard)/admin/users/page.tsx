// User management page for admins
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { adminService, type AdminUserStats } from '@/lib/services/adminService';
import { UsersTable } from '@/components/admin/UsersTable';
import { CreateUserForm } from '@/components/admin/CreateUserForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UserManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const data = await adminService.getAllUsersWithStats();
    setUsers(data);
    setLoading(false);
    router.refresh(); // Refresh Next.js cache
  };

  useEffect(() => {
    async function checkAdminAndLoad() {
      if (!user) return;

      const isAdmin = await adminService.isAdmin(user.id);
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }

      loadUsers();
    }

    checkAdminAndLoad();
  }, [user, router]);

  const handleUserCreated = () => {
    setDialogOpen(false);
    loadUsers();
  };

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
              <Users className="h-8 w-8" />
              User Management
            </h1>
            <p className="text-muted-foreground">
              Manage users, roles, and work dates
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system. A temporary password will be generated.
                </DialogDescription>
              </DialogHeader>
              <CreateUserForm onSuccess={handleUserCreated} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
          <CardDescription>
            Manage user roles and view leave statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} onUpdate={loadUsers} />
        </CardContent>
      </Card>
    </div>
  );
}



