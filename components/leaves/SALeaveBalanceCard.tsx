// SA Leave Balance Card with cycle and accrual information
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/dateUtils';
import { Calendar, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface SALeaveBalanceCardProps {
  leaveType: {
    name: string;
    color: string;
    cycle_length_months?: number;
    accrual_method?: string;
    is_statutory?: boolean;
  };
  balance: {
    total_days: number;
    used_days: number;
    remaining_days: number;
    accrued_days?: number;
    carried_over_days?: number;
    cycle_start_date?: string;
    cycle_end_date?: string;
  };
  nextAccrualDate?: string;
  nextAccrualAmount?: number;
}

export function SALeaveBalanceCard({
  leaveType,
  balance,
  nextAccrualDate,
  nextAccrualAmount,
}: SALeaveBalanceCardProps) {
  const usagePercentage = (balance.used_days / balance.total_days) * 100 || 0;
  const isMonthlyAccrual = leaveType.accrual_method === 'MONTHLY';
  const isSickLeave = leaveType.cycle_length_months === 36;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: leaveType.color }}
              />
              {leaveType.name}
              {leaveType.is_statutory && (
                <Badge variant="outline" className="text-xs">
                  Statutory
                </Badge>
              )}
            </CardTitle>
            {balance.cycle_start_date && balance.cycle_end_date && (
              <CardDescription className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                Cycle: {formatDate(balance.cycle_start_date, 'MMM d, yyyy')} - {formatDate(balance.cycle_end_date, 'MMM d, yyyy')}
                {isSickLeave && <span className="text-orange-600 font-medium">(36-month cycle)</span>}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Usage</span>
            <span className="font-medium">
              {balance.used_days} / {balance.total_days} days
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
        </div>

        {/* Balance Details */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          {isMonthlyAccrual && balance.accrued_days !== undefined && (
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Accrued</p>
              <p className="font-bold text-primary">{balance.accrued_days}</p>
            </div>
          )}
          
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Used</p>
            <p className="font-bold text-orange-600">{balance.used_days}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Available</p>
            <p className="font-bold text-green-600">{balance.remaining_days}</p>
          </div>

          {balance.carried_over_days !== undefined && balance.carried_over_days > 0 && (
            <div className="space-y-1 col-span-3">
              <p className="text-muted-foreground text-xs">Carried Over</p>
              <p className="font-bold text-blue-600">{balance.carried_over_days} days</p>
            </div>
          )}
        </div>

        {/* Next Accrual Info */}
        {isMonthlyAccrual && nextAccrualDate && nextAccrualAmount && (
          <div className="pt-3 border-t">
            <div className="flex items-start gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Next Accrual</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(nextAccrualDate, 'MMM d, yyyy')}: +{nextAccrualAmount} days
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sick Leave Cycle Reset Info */}
        {isSickLeave && balance.cycle_end_date && (
          <div className="pt-3 border-t">
            <div className="flex items-start gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Cycle Resets</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(balance.cycle_end_date, 'MMM d, yyyy')} (36-month cycle)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Low Balance Warning */}
        {balance.remaining_days < 3 && balance.remaining_days > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
              <p className="text-orange-900">
                Low balance: Only {balance.remaining_days} {balance.remaining_days === 1 ? 'day' : 'days'} remaining
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

