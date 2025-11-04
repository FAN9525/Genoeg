// Monthly accrual cron job endpoint
// Configure in Vercel: https://vercel.com/docs/cron-jobs
// Schedule: 0 0 1 * * (First day of each month at midnight)

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Run monthly accrual function
    // @ts-ignore - Supabase RPC types
    const { data, error } = await supabase.rpc('run_monthly_annual_leave_accrual');

    if (error) {
      console.error('Accrual error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Monthly accrual completed',
      processed: (data as any)?.length || 0,
      results: data,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow running manually for testing
export async function POST(request: Request) {
  return GET(request);
}

