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
  is_half_day: z.boolean().optional(),
  half_day_period: z.enum(['morning', 'afternoon']).optional(),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
}, {
  message: "End date must be after or equal to start date",
  path: ["end_date"],
}).refine((data) => {
  // If half-day is selected, start and end date must be the same
  if (data.is_half_day) {
    return data.start_date === data.end_date;
  }
  return true;
}, {
  message: "Half-day leave must be for a single day only",
  path: ["end_date"],
}).refine((data) => {
  // If half-day is selected, period must be specified
  if (data.is_half_day) {
    return data.half_day_period === 'morning' || data.half_day_period === 'afternoon';
  }
  return true;
}, {
  message: "Please select morning or afternoon for half-day leave",
  path: ["half_day_period"],
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
  const [approvedLeaves, setApprovedLeaves] = useState<any[]>([]);
  const [dateConflict, setDateConflict] = useState<string | null>(null);

  const form = useForm<LeaveRequestInput>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leave_type_id: '',
      start_date: '',
      end_date: '',
      reason: '',
      family_responsibility_reason: '',
      is_half_day: false,
      half_day_period: undefined,
    },
  });

  const selectedLeaveTypeId = form.watch('leave_type_id');
  const startDate = form.watch('start_date');
  const endDate = form.watch('end_date');
  const frlReason = form.watch('family_responsibility_reason');
  const isHalfDay = form.watch('is_half_day');
  const halfDayPeriod = form.watch('half_day_period');

  const selectedLeaveType = leaveTypes.find(lt => lt.id === selectedLeaveTypeId);
  const isFRL = selectedLeaveType?.name === 'Family Responsibility Leave';

  // Auto-set end date to start date when half-day is selected
  useEffect(() => {
    if (isHalfDay && startDate && startDate !== endDate) {
      form.setValue('end_date', startDate);
    }
  }, [isHalfDay, startDate, endDate, form]);

  useEffect(() => {
    async function loadLeaveTypes() {
      const types = await leaveService.getLeaveTypes();
      setLeaveTypes(types);
    }
    async function loadApprovedLeaves() {
      // Get user's approved and pending leaves to check for conflicts
      const userLeaves = await leaveService.getUserLeaves(userId);
      const approved = userLeaves.filter(
        (leave: any) => leave.status === 'approved' || leave.status === 'pending'
      );
      setApprovedLeaves(approved);
    }
    loadLeaveTypes();
    loadApprovedLeaves();
  }, [userId]);

  // Calculate working days and validate when dates or type change
  useEffect(() => {
    async function validateRequest() {
      if (startDate && endDate && selectedLeaveTypeId) {
        setValidating(true);
        
        try {
          // Check for date conflicts with existing approved/pending leaves
          const requestStart = new Date(startDate);
          const requestEnd = new Date(endDate);
          
          const conflicts = approvedLeaves.filter((leave: any) => {
            const leaveStart = new Date(leave.start_date);
            const leaveEnd = new Date(leave.end_date);
            
            // Check if dates overlap
            return (
              (requestStart >= leaveStart && requestStart <= leaveEnd) ||
              (requestEnd >= leaveStart && requestEnd <= leaveEnd) ||
              (requestStart <= leaveStart && requestEnd >= leaveEnd)
            );
          });

          if (conflicts.length > 0) {
            const conflictLeave = conflicts[0];
            setDateConflict(
              `These dates overlap with your ${conflictLeave.leave_type?.name || 'existing'} (${conflictLeave.start_date} to ${conflictLeave.end_date}) which is ${conflictLeave.status}. Please choose different dates.`
            );
          } else {
            setDateConflict(null);
          }
          
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
        setDateConflict(null);
      }
    }

    validateRequest();
  }, [startDate, endDate, selectedLeaveTypeId, userId, frlReason, isFRL, approvedLeaves]);

  async function onSubmit(data: LeaveRequestInput) {
    // Check for date conflicts first
    if (dateConflict) {
      toast.error('Cannot submit: Date conflict detected', {
        description: dateConflict,
      });
      return;
    }

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
        is_half_day: data.is_half_day || false,
        half_day_period: data.half_day_period,
      });
      
      const daysText = data.is_half_day 
        ? `0.5 days (${data.half_day_period})` 
        : `${workingDays} days`;
      
      toast.success('Leave request submitted successfully!', {
        description: `${daysText} requested`,
      });
      
      form.reset();
      setWorkingDays(null);
      setValidation(null);
      setDateConflict(null);
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

        {/* Half-Day Leave Option */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <FormField
            control={form.control}
            name="is_half_day"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={loading}
                    className="mt-1 h-4 w-4"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Half-Day Leave
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Request leave for only part of the day (0.5 days)
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {isHalfDay && (
            <FormField
              control={form.control}
              name="half_day_period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="morning">
                        <div className="flex flex-col">
                          <span className="font-medium">Morning</span>
                          <span className="text-xs text-muted-foreground">08h00 - 12h00</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="afternoon">
                        <div className="flex flex-col">
                          <span className="font-medium">Afternoon</span>
                          <span className="text-xs text-muted-foreground">12h30 - 16h30</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Work hours: 08h00 - 16h30 (Morning: 08h00-12h00, Afternoon: 12h30-16h30)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

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
                  <Input 
                    type="date" 
                    {...field} 
                    disabled={loading || isHalfDay} 
                  />
                </FormControl>
                {isHalfDay && (
                  <FormDescription className="text-xs">
                    End date is same as start date for half-day leave
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Date Conflict Warning */}
        {dateConflict && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">
                  ⚠️ Date Conflict Detected
                </p>
                <p className="text-sm text-red-800">
                  {dateConflict}
                </p>
              </div>
            </div>
          </div>
        )}

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
          disabled={loading || validating || !validation?.is_valid || !!dateConflict}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Leave Request
        </Button>
      </form>
    </Form>
  );
}




