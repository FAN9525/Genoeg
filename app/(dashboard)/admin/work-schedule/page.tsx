// Work schedule management page for admins
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { adminService } from '@/lib/services/adminService';
import { scheduleService } from '@/lib/services/scheduleService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, ArrowLeft, Play, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function WorkSchedulePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [department, setDepartment] = useState('Claims');
  const [startDate, setStartDate] = useState('2026-01-05'); // First Monday of 2026
  const [weeks, setWeeks] = useState(12);
  const [preview, setPreview] = useState<any[]>([]);

  useEffect(() => {
    async function checkAdminAndLoad() {
      if (!user) return;

      const isAdmin = await adminService.isAdmin(user.id);
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }

      setLoading(false);
    }

    checkAdminAndLoad();
  }, [user, router]);

  const handleGeneratePreview = async () => {
    try {
      setGenerating(true);
      const data = await scheduleService.generateRotatingSchedule(
        department,
        startDate,
        weeks
      );
      setPreview(data);
      toast.success(`Generated preview for ${data.length} schedule entries`);
    } catch (error) {
      toast.error('Failed to generate preview');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleApplySchedule = async () => {
    try {
      setGenerating(true);
      const count = await scheduleService.applyRotatingSchedule(
        department,
        startDate,
        weeks
      );
      toast.success(`Applied schedule! Created/updated ${count} entries`);
      setPreview([]);
    } catch (error) {
      toast.error('Failed to apply schedule');
      console.error(error);
    } finally {
      setGenerating(false);
    }
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-8 w-8" />
            Work Schedule Management
          </h1>
          <p className="text-muted-foreground">
            Generate and manage 4-day workweek rotating schedules
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Rotating Schedule</CardTitle>
          <CardDescription>
            Create a rotating 4-day workweek schedule where each employee works 4 days and has 1 weekday off.
            The schedule rotates to ensure fair distribution of days off.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Claims">Claims</SelectItem>
                  <SelectItem value="Underwriting">Underwriting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date (Monday)</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weeks">Number of Weeks</Label>
              <Input
                id="weeks"
                type="number"
                min="1"
                max="52"
                value={weeks}
                onChange={(e) => setWeeks(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGeneratePreview}
              disabled={generating}
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Schedule
            </Button>
            <Button onClick={handleApplySchedule} disabled={generating || preview.length === 0}>
              <Play className="h-4 w-4 mr-2" />
              Apply Schedule
            </Button>
          </div>

          {preview.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 font-semibold">
                Preview: {preview.length} schedule entries
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2">Employee</th>
                      <th className="text-left p-2">Week Start</th>
                      <th className="text-center p-2">Mon</th>
                      <th className="text-center p-2">Tue</th>
                      <th className="text-center p-2">Wed</th>
                      <th className="text-center p-2">Thu</th>
                      <th className="text-center p-2">Fri</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((entry, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{entry.user_name}</td>
                        <td className="p-2">{entry.week_start}</td>
                        <td className="text-center p-2">
                          {entry.monday_off ? '❌' : '✅'}
                        </td>
                        <td className="text-center p-2">
                          {entry.tuesday_off ? '❌' : '✅'}
                        </td>
                        <td className="text-center p-2">
                          {entry.wednesday_off ? '❌' : '✅'}
                        </td>
                        <td className="text-center p-2">
                          {entry.thursday_off ? '❌' : '✅'}
                        </td>
                        <td className="text-center p-2">
                          {entry.friday_off ? '❌' : '✅'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">4-Day Workweek Rotation:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Each employee works 4 days per week with 1 weekday off</li>
              <li>Days off rotate weekly to ensure fair distribution</li>
              <li>Only 1 person per department is off each day</li>
              <li>Office remains open all 5 weekdays with full coverage</li>
              <li>Employees get variety in their days off (Mondays, Fridays, etc.)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Example for 3 Staff (A, B, C):</h3>
            <div className="text-sm space-y-1 text-muted-foreground">
              <div><strong>Week 1:</strong> A off Mon, B off Tue, C off Wed, A off Thu, B off Fri</div>
              <div><strong>Week 2:</strong> B off Mon, C off Tue, A off Wed, B off Thu, C off Fri</div>
              <div><strong>Week 3:</strong> C off Mon, A off Tue, B off Wed, C off Thu, A off Fri</div>
              <div className="text-xs mt-2">Pattern continues rotating...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


