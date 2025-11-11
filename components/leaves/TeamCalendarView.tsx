// Team Calendar View - Monthly calendar grid showing all approved leaves
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Leave } from '@/lib/types';
import { formatDate } from '@/lib/utils/dateUtils';

interface TeamCalendarViewProps {
  leaves: Leave[];
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  leaves: Leave[];
}

export function TeamCalendarView({ leaves }: TeamCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate calendar days for the current month
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the previous month's days to fill the first week
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Go to Sunday

    // End at the next month's days to fill the last week
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())); // Go to Saturday

    const days: CalendarDay[] = [];
    const currentDateObj = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (currentDateObj <= endDate) {
      const dateStr = currentDateObj.toISOString().split('T')[0];
      
      // Find leaves that span this date
      const leavesOnThisDay = leaves.filter((leave) => {
        // Use date strings for comparison to avoid timezone issues
        const leaveStartStr = leave.start_date; // Format: YYYY-MM-DD
        const leaveEndStr = leave.end_date; // Format: YYYY-MM-DD
        const checkDateStr = dateStr; // Format: YYYY-MM-DD
        
        // String comparison works correctly for YYYY-MM-DD format
        return checkDateStr >= leaveStartStr && checkDateStr <= leaveEndStr;
      });

      days.push({
        date: new Date(currentDateObj),
        isCurrentMonth: currentDateObj.getMonth() === month,
        isToday: currentDateObj.toDateString() === today.toDateString(),
        leaves: leavesOnThisDay,
      });

      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{monthYear}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="border rounded-lg overflow-hidden">
          {/* Week Day Headers */}
          <div className="grid grid-cols-7 bg-muted">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-semibold border-r last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`
                  min-h-[120px] border-r border-b last:border-r-0 p-2
                  ${!day.isCurrentMonth ? 'bg-muted/30' : 'bg-white'}
                  ${day.isToday ? 'bg-blue-50 border-blue-300' : ''}
                `}
              >
                {/* Day Number */}
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={`
                      text-sm font-semibold
                      ${!day.isCurrentMonth ? 'text-muted-foreground' : ''}
                      ${day.isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs' : ''}
                    `}
                  >
                    {day.date.getDate()}
                  </span>
                </div>

                {/* Leaves on this day */}
                <div className="space-y-1">
                  {day.leaves.slice(0, 3).map((leave, idx) => (
                    <div
                      key={`${leave.id}-${idx}`}
                      className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: leave.leave_type?.color || '#3B82F6',
                        color: 'white',
                      }}
                      title={`${leave.user?.full_name} - ${leave.leave_type?.name}\n${formatDate(leave.start_date)} to ${formatDate(leave.end_date)}`}
                    >
                      <div className="font-semibold truncate">
                        {leave.user?.full_name?.split(' ')[0]}
                      </div>
                      <div className="truncate opacity-90">
                        {leave.leave_type?.name}
                      </div>
                    </div>
                  ))}
                  
                  {/* Show "+X more" if there are more than 3 leaves */}
                  {day.leaves.length > 3 && (
                    <div className="text-xs text-muted-foreground font-semibold">
                      +{day.leaves.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 rounded-full bg-blue-600"></div>
            <span>Today</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: {leaves.length} approved {leaves.length === 1 ? 'leave' : 'leaves'} this month
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

