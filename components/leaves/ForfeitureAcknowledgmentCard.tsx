// Forfeiture Acknowledgment Card - 18-month leave forfeiture rule
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { leaveService } from '@/lib/services/leaveService';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils/dateUtils';

interface ForfeitureItem {
  year: number;
  days_forfeited: number;
  reason: string;
  requires_acknowledgment: boolean;
}

interface ForfeitureAcknowledgmentCardProps {
  userId: string;
  onForfeitureProcessed?: () => void;
}

export function ForfeitureAcknowledgmentCard({
  userId,
  onForfeitureProcessed,
}: ForfeitureAcknowledgmentCardProps) {
  const [forfeiturePreview, setForfeiturePreview] = useState<ForfeitureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    loadForfeiturePreview();
  }, [userId]);

  const loadForfeiturePreview = async () => {
    try {
      setLoading(true);
      const data = await leaveService.getForfeiturePreview(userId);
      
      // Filter to only show items that require acknowledgment
      const itemsToForfeit = (data as any[]).filter((item: any) => 
        item.requires_acknowledgment && item.days_forfeited > 0
      );
      
      setForfeiturePreview(itemsToForfeit as ForfeitureItem[]);
    } catch (error) {
      console.error('Error loading forfeiture preview:', error);
      toast.error('Failed to load forfeiture information');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessForfeiture = async () => {
    if (!acknowledged) {
      toast.error('Please acknowledge the forfeiture before proceeding');
      return;
    }

    try {
      setProcessing(true);
      
      const result = await leaveService.processForfeiture(userId);
      
      const totalForfeited = (result as any[]).reduce(
        (sum: number, item: any) => sum + item.days_forfeited,
        0
      );

      toast.success(
        `Successfully processed forfeiture of ${totalForfeited} days of annual leave`,
        {
          description: 'Your leave balance has been updated in compliance with SA labour law.',
        }
      );

      // Callback to refresh parent component
      if (onForfeitureProcessed) {
        onForfeitureProcessed();
      }

      // Reload preview (should now be empty)
      await loadForfeiturePreview();
    } catch (error) {
      console.error('Error processing forfeiture:', error);
      toast.error('Failed to process forfeiture. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Don't show if there's nothing to forfeit
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (forfeiturePreview.length === 0) {
    return null; // No forfeiture needed
  }

  const totalDaysToForfeit = forfeiturePreview.reduce(
    (sum, item) => sum + item.days_forfeited,
    0
  );

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-red-900">⚠️ Leave Forfeiture Required</CardTitle>
        </div>
        <CardDescription className="text-red-800">
          You have <strong className="font-bold">{totalDaysToForfeit} days</strong> of annual
          leave that has exceeded the 18-month legal limit and must be forfeited.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Forfeiture Table */}
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Days to Forfeit</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forfeiturePreview.map((item) => (
                <TableRow key={item.year}>
                  <TableCell className="font-medium">{item.year}</TableCell>
                  <TableCell>
                    <Badge variant="destructive" className="font-bold">
                      {item.days_forfeited} days
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-md">
                    {item.reason}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-red-50 font-bold">
                <TableCell>Total</TableCell>
                <TableCell>
                  <Badge variant="destructive" className="font-bold text-base">
                    {totalDaysToForfeit} days
                  </Badge>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Legal Information */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Legal Requirement - BCEA Compliance</AlertTitle>
          <AlertDescription className="text-sm space-y-2">
            <p>
              Under the <strong>Basic Conditions of Employment Act (BCEA)</strong> and established
              case law (<em>Ludick v Rural Maintenance</em>), unused annual leave older than{' '}
              <strong>18 months</strong> is automatically forfeited.
            </p>
            <p className="mt-2">
              <strong>Timeline:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>12 months: Annual leave cycle (Jan 1 - Dec 31)</li>
              <li>+ 6 months: Carry-over period (until June 30 of following year)</li>
              <li>= 18 months total: Maximum time to use leave</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Information Note */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Important Information</AlertTitle>
          <AlertDescription className="text-sm">
            <ul className="list-disc list-inside space-y-1">
              <li>This forfeiture is required by South African labour law</li>
              <li>Forfeited leave will be permanently removed from your balance</li>
              <li>This process cannot be reversed once completed</li>
              <li>Current year leave (2025 and beyond) is not affected</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Acknowledgment Checkbox */}
        <div className="bg-white p-4 rounded-lg border space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="acknowledge-forfeiture"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked === true)}
              className="mt-1"
            />
            <Label htmlFor="acknowledge-forfeiture" className="text-sm cursor-pointer">
              <strong>I understand and acknowledge</strong> that {totalDaysToForfeit} days of my
              annual leave will be permanently forfeited as per SA labour law requirements (BCEA).
              I confirm that I have read and understand the legal basis for this forfeiture.
            </Label>
          </div>

          <Button
            variant="destructive"
            disabled={!acknowledged || processing}
            onClick={handleProcessForfeiture}
            className="w-full"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing Forfeiture...
              </>
            ) : (
              `Process Forfeiture of ${totalDaysToForfeit} Days`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

