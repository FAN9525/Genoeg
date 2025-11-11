// SA-compliant leave request form with validation
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { leaveService } from '@/lib/services/leaveService';
import { 
  calculateSAWorkingDays, 
  validateSALeaveRequest,
  FAMILY_RESPONSIBILITY_REASONS,
  type FamilyResponsibilityReason 
} from '@/lib/utils/saLeaveRules';
import type { LeaveType } from '@/lib/types';
import { Loader2, Calendar, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { toast } from 'sonner';

const leaveRequestSchema = z.object({
  leave_type_id: z.string().uuid('Please select a leave type'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().optional(),
  family_responsibility_reason: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
}, {
  message: "End date must be after or equal to start date",
  path: ["end_date"],
});

type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;

interface SALeaveRequestFormProps {
  userId: string;
  onSuccess?: () => void;
}

export function SALeaveRequestForm({ userId, onSuccess }: SALeaveRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [workingDays, setWorkingDays] = useState<number | null>(null);
  const [validation, setValidation] = useState<{
    is_valid: boolean;
    message: string;
    requires_medical_cert: boolean;
  } | null>(null);

  const form = useForm<LeaveRequestInput>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leave_type_id: '',
      start_date: '',
      end_date: '',
      reason: '',
      family_responsibility_reason: '',
    },
  });

  const selectedLeaveTypeId = form.watch('leave_type_id');
  const startDate = form.watch('start_date');
  const endDate = form.watch('end_date');
  const frlReason = form.watch('family_responsibility_reason');

  const selectedLeaveType = leaveTypes.find(lt => lt.id === selectedLeaveTypeId);
  const isFRL = selectedLeaveType?.name === 'Family Responsibility Leave';

  useEffect(() => {
    async function loadLeaveTypes() {
      const types = await leaveService.getLeaveTypes();
      setLeaveTypes(types);
    }
    loadLeaveTypes();
  }, []);

  // Calculate working days and validate when dates or type change
  useEffect(() => {
    async function validateRequest() {
      if (startDate && endDate && selectedLeaveTypeId) {
        setValidating(true);
        
        try {
          // Calculate SA working days
          const days = await calculateSAWorkingDays(startDate, endDate);
          setWorkingDays(days);

          // Validate against SA rules
          const validationResult = await validateSALeaveRequest(
            userId,
            selectedLeaveTypeId,
            startDate,
            endDate,
            isFRL ? frlReason : undefined
          );

          setValidation(validationResult);
        } catch (error) {
          console.error('Validation error:', error);
        } finally {
          setValidating(false);
        }
      } else {
        setWorkingDays(null);
        setValidation(null);
      }
    }

    validateRequest();
  }, [startDate, endDate, selectedLeaveTypeId, userId, frlReason, isFRL]);

  async function onSubmit(data: LeaveRequestInput) {
    // Final validation check
    if (!validation?.is_valid) {
      toast.error(validation?.message || 'Invalid leave request');
      return;
    }

    try {
      setLoading(true);
      await leaveService.createLeave(userId, {
        leave_type_id: data.leave_type_id,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason,
      });
      toast.success('Leave request submitted successfully!');
      form.reset();
      setWorkingDays(null);
      setValidation(null);
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
                  {leaveTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        <span>{type.name}</span>
                        {type.is_statutory && (
                          <span className="text-xs text-muted-foreground">(Statutory)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLeaveType?.description && (
                <FormDescription className="text-xs">
                  {selectedLeaveType.description}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {isFRL && (
          <FormField
            control={form.control}
            name="family_responsibility_reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason (Required for FRL)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select qualifying reason" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FAMILY_RESPONSIBILITY_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Only statutory qualifying reasons are allowed for Family Responsibility Leave
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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

        {/* Working Days Calculation */}
        {validating && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">Calculating working days...</span>
            </div>
          </div>
        )}

        {!validating && workingDays !== null && (
          <div className={`rounded-lg border p-4 ${validation?.is_valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                {validation?.is_valid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${validation?.is_valid ? 'text-green-900' : 'text-red-900'}`}>
                    {validation?.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-bold">{workingDays}</span> working days
                      <span className="text-muted-foreground ml-1">
                        (excludes weekends & public holidays)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {validation?.requires_medical_cert && (
                <div className="flex items-start gap-2 pt-2 border-t">
                  <FileText className="h-4 w-4 text-orange-600 mt-0.5" />
                  <p className="text-sm text-orange-900">
                    <strong>Medical Certificate Required:</strong> Sick leave of 2+ consecutive days requires a medical certificate.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason {isFRL && '(Additional Details)'}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide details about your leave request..."
                  className="resize-none"
                  rows={4}
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Add any additional information or context
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || validating || !validation?.is_valid}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Leave Request
        </Button>
      </form>
    </Form>
  );
}




