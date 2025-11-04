// Server-side API for admin user creation
// Requires Service Role Key (server-side only)

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if current user is admin
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if ((profile as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { email, full_name, department, role, start_work_date, end_work_date } = body;

    if (!email || !full_name || !start_work_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

    // Create user directly in auth.users table using database function
    // @ts-ignore - Supabase RPC types may need regeneration
    const { data: newUserData, error: createError } = await supabase.rpc('create_admin_user', {
      p_email: email,
      p_password: tempPassword,
      p_full_name: full_name,
      p_department: department || null,
      p_role: role || 'employee',
      p_start_work_date: start_work_date,
      p_end_work_date: end_work_date || null,
    } as any);

    if (createError) {
      console.error('Error creating user:', createError);
      
      // Handle duplicate email error
      if (createError.message.includes('duplicate') || 
          createError.message.includes('unique') ||
          createError.code === '23505') {
        return NextResponse.json(
          { error: 'Email already exists. Please use a different email address.' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: newUserData,
      tempPassword,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

