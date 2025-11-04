// Request leave page
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaveRequestForm } from '@/components/leaves/LeaveRequestForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RequestLeavePage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const handleSuccess = () => {
    router.push('/my-leaves');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Request Leave</h1>
        <p className="text-muted-foreground">
          Submit a new leave request for approval
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Request Form</CardTitle>
          <CardDescription>
            Fill in the details below to submit your leave request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeaveRequestForm userId={user.id} onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}

