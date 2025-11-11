// My schedule page - view personal work schedule
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { scheduleService, type ScheduleDay } from '@/lib/services/scheduleService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { ForfeitureAcknowledgmentCard } from '@/components/leaves/ForfeitureAcknowledgmentCard';

export default function MySchedulePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    async function loadSchedule() {
      if (!user) return;

      try {
        setLoading(true);
        
        // Get schedule for current month
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        const data = await scheduleService.getUserSchedule(
          user.id,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        
        setSchedule(data);
      } catch (error) {
        console.error('Error loading schedule:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, [user, currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const groupByWeek = (scheduleData: ScheduleDay[]) => {
    const weeks = new Map<string, ScheduleDay[]>();
    scheduleData.forEach(day => {
      const week = day.week_start;
      if (!weeks.has(week)) {
        weeks.set(week, []);
      }
      weeks.get(week)!.push(day);
    });
    return Array.from(weeks.entries());
  };

  const workDaysCount = schedule.filter(d => !d.is_off).length;
  const offDaysCount = schedule.filter(d => d.is_off).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const weeks = groupByWeek(schedule);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          My Work Schedule
        </h1>
        <p className="text-muted-foreground">
          View your 4-day workweek schedule and planned days off
        </p>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <CardDescription>
                {workDaysCount} work days • {offDaysCount} scheduled days off
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {schedule.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No schedule data available for this month.</p>
              <p className="text-sm mt-2">
                The 4-day workweek schedule is effective from 2026.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {weeks.map(([weekStart, days]) => (
                <div key={weekStart} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-3 font-semibold text-sm">
                    Week of {new Date(weekStart).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="grid grid-cols-5 divide-x">
                    {days.map(day => (
                      <div
                        key={day.date}
                        className={`p-4 ${day.is_off ? 'bg-red-50' : 'bg-green-50'}`}
                      >
                        <div className="font-semibold text-sm mb-2">
                          {day.day_of_week}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <Badge
                          variant={day.is_off ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {day.is_off ? '🏖️ Day Off' : '💼 Working'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {schedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{workDaysCount}</div>
                <div className="text-sm text-muted-foreground">Work Days</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{offDaysCount}</div>
                <div className="text-sm text-muted-foreground">Days Off</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {offDaysCount > 0 ? Math.round((workDaysCount / (workDaysCount + offDaysCount)) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Work Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Forfeiture Section */}
      {user && (
        <div id="forfeiture">
          <ForfeitureAcknowledgmentCard 
            userId={user.id} 
            onForfeitureProcessed={() => {
              // Optionally reload schedule or balances
              window.location.reload();
            }}
          />
        </div>
      )}
    </div>
  );
}


