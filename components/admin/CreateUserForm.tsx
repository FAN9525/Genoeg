// Create user form for admin
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminService } from '@/lib/services/adminService';
import { Loader2, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  department: z.string().optional(),
  role: z.enum(['employee', 'manager', 'admin']),
  start_work_date: z.string().min(1, 'Start work date is required'),
  end_work_date: z.string().optional(),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

interface CreateUserFormProps {
  onSuccess?: () => void;
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      full_name: '',
      department: '',
      role: 'employee',
      start_work_date: new Date().toISOString().split('T')[0],
      end_work_date: '',
    },
  });

  async function onSubmit(data: CreateUserInput) {
    try {
      setLoading(true);
      const result = await adminService.createUser(data);
      setTempPassword(result.tempPassword);
      toast.success(`User created! Temporary password: ${result.tempPassword}`);
      form.reset();
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      
      // Handle specific error types
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists') || errorMessage.includes('unique')) {
        toast.error(`Email already exists. Please use a different email address.`);
        form.setError('email', {
          type: 'manual',
          message: 'This email is already registered',
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  const copyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {tempPassword && (
        <div className="p-4 border rounded-lg bg-green-50 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-green-900">User Created Successfully!</p>
              <p className="text-sm text-green-700 mt-1">
                Temporary Password: <code className="font-mono font-bold">{tempPassword}</code>
              </p>
              <p className="text-xs text-green-600 mt-2">
                ⚠️ Save this password! It won't be shown again. The user should change it on first login.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyPassword}
              className="ml-4"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john.doe@company.com"
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Engineering" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Admin can manage users, Manager can approve leaves, Employee is standard user
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="start_work_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Work Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={loading} />
                  </FormControl>
                  <FormDescription>Leave balances calculated from this date</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_work_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Work Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={loading} />
                  </FormControl>
                  <FormDescription>Leave blank for current employees</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create User
          </Button>
        </form>
      </Form>
    </div>
  );
}

