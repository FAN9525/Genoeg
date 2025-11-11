// Forfeiture Warning Banner - Shows on dashboard when user has pending forfeiture
'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { leaveService } from '@/lib/services/leaveService';
import Link from 'next/link';

interface ForfeitureWarningBannerProps {
  userId: string;
}

export function ForfeitureWarningBanner({ userId }: ForfeitureWarningBannerProps) {
  const [hasPendingForfeiture, setHasPendingForfeiture] = useState(false);
  const [totalDays, setTotalDays] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForfeiture();
  }, [userId]);

  const checkForfeiture = async () => {
    try {
      setLoading(true);
      const pending = await leaveService.checkPendingForfeiture(userId);
      setHasPendingForfeiture(pending);

      if (pending) {
        // Get the preview to show total days
        const preview = await leaveService.getForfeiturePreview(userId);
        const total = preview.reduce((sum: number, item: any) => sum + item.days_forfeited, 0);
        setTotalDays(total);
      }
    } catch (error) {
      console.error('Error checking forfeiture:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !hasPendingForfeiture || totalDays === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6 border-red-300 bg-red-50">
      <AlertTriangle className="h-5 w-5 text-red-600" />
      <AlertTitle className="text-red-900 font-bold text-lg">
        ⚠️ Action Required: Leave Forfeiture
      </AlertTitle>
      <AlertDescription className="text-red-800 space-y-3">
        <p>
          You have <strong className="font-bold text-lg">{totalDays} days</strong> of unused annual
          leave that must be forfeited under South African labour law (18-month rule).
        </p>
        <div className="flex gap-3">
          <Button asChild variant="destructive">
            <Link href="/my-schedule#forfeiture">Review and Acknowledge Forfeiture</Link>
          </Button>
          <Button asChild variant="outline" className="border-red-600 text-red-700 hover:bg-red-100">
            <Link href="/my-schedule#forfeiture">Learn More</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

