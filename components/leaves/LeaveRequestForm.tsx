// Leave request form component
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { createLeaveSchema, type CreateLeaveInput } from '@/lib/utils/validations';
import { leaveService } from '@/lib/services/leaveService';
import { calculateBusinessDays } from '@/lib/utils/dateUtils';
import type { LeaveType } from '@/lib/types';
import { Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface LeaveRequestFormProps {
  userId: string;
  onSuccess?: () => void;
}

export function LeaveRequestForm({ userId, onSuccess }: LeaveRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [calculatedDays, setCalculatedDays] = useState<number | null>(null);

  const form = useForm<CreateLeaveInput>({
    resolver: zodResolver(createLeaveSchema),
    defaultValues: {
      leave_type_id: '',
      start_date: '',
      end_date: '',
      reason: '',
    },
  });

  useEffect(() => {
    async function loadLeaveTypes() {
      const types = await leaveService.getLeaveTypes();
      setLeaveTypes(types);
    }
    loadLeaveTypes();
  }, []);

  // Calculate days when dates change
  const startDate = form.watch('start_date');
  const endDate = form.watch('end_date');

  useEffect(() => {
    if (startDate && endDate) {
      try {
        const days = calculateBusinessDays(startDate, endDate);
        setCalculatedDays(days);
      } catch (error) {
        setCalculatedDays(null);
      }
    } else {
      setCalculatedDays(null);
    }
  }, [startDate, endDate]);

  async function onSubmit(data: CreateLeaveInput) {
    try {
      setLoading(true);
      await leaveService.createLeave(userId, data);
      toast.success('Leave request submitted successfully!');
      form.reset();
      setCalculatedDays(null);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="leave_type_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Leave Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Choose the type of leave you're requesting</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {calculatedDays !== null && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                Total Business Days: <span className="text-lg font-bold">{calculatedDays}</span>
              </span>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide details about your leave request..."
                  className="resize-none"
                  rows={4}
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormDescription>
                Add any additional information or context for your request
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Leave Request
        </Button>
      </form>
    </Form>
  );
}

