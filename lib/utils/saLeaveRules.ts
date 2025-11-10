// South African Leave Rules and Validation
import { createClient } from '@/lib/supabase/client';

export const SA_LEAVE_CONSTANTS = {
  ANNUAL_LEAVE_DAYS_PER_YEAR: 21,
  ANNUAL_LEAVE_ACCRUAL_PER_MONTH: 1.75,
  SICK_LEAVE_DAYS_PER_CYCLE: 30,
  SICK_LEAVE_CYCLE_MONTHS: 36,
  FAMILY_RESPONSIBILITY_DAYS_PER_YEAR: 3,
  FAMILY_RESPONSIBILITY_MIN_SERVICE_MONTHS: 4,
  FAMILY_RESPONSIBILITY_MIN_WORK_DAYS: 4,
  SHARED_PARENTAL_LEAVE_DAYS: 130,
  SICK_LEAVE_MEDICAL_CERT_THRESHOLD: 2,
};

export const FAMILY_RESPONSIBILITY_REASONS = [
  { value: 'child_birth', label: 'Birth of child' },
  { value: 'child_illness', label: 'Child is ill (requires care)' },
  { value: 'death_spouse', label: 'Death of spouse' },
  { value: 'death_life_partner', label: 'Death of life partner' },
  { value: 'death_parent', label: 'Death of parent' },
  { value: 'death_grandparent', label: 'Death of grandparent' },
  { value: 'death_child', label: 'Death of child' },
  { value: 'death_grandchild', label: 'Death of grandchild' },
  { value: 'death_sibling', label: 'Death of sibling' },
] as const;

export type FamilyResponsibilityReason = typeof FAMILY_RESPONSIBILITY_REASONS[number]['value'];

/**
 * Calculate SA working days (excludes weekends and public holidays)
 */
export async function calculateSAWorkingDays(
  startDate: string,
  endDate: string
): Promise<number> {
  const supabase = createClient();

  // @ts-ignore - Supabase RPC types
  const { data, error } = await supabase.rpc('calculate_sa_working_days', {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error('Error calculating working days:', error);
    return 0;
  }

  return data || 0;
}

/**
 * Calculate annual leave accrual for a user
 */
export async function calculateAnnualLeaveAccrual(
  employmentStartDate: string,
  asOfDate?: string
): Promise<number> {
  const supabase = createClient();

  // @ts-ignore - Supabase RPC types
  const { data, error } = await supabase.rpc('calculate_annual_leave_accrual', {
    p_employment_start_date: employmentStartDate,
    p_as_of_date: asOfDate || new Date().toISOString().split('T')[0],
  });

  if (error) {
    console.error('Error calculating accrual:', error);
    return 0;
  }

  return data || 0;
}

/**
 * Check if user is eligible for Family Responsibility Leave
 */
export async function checkFRLEligibility(
  userId: string,
  requestDate?: string,
  reason?: FamilyResponsibilityReason
): Promise<{
  is_eligible: boolean;
  message: string;
  months_employed: number;
  work_days_per_week: number;
}> {
  const supabase = createClient();

  // @ts-ignore - Supabase RPC types
  const { data, error } = await supabase.rpc('check_frl_eligibility', {
    p_user_id: userId,
    p_request_date: requestDate || new Date().toISOString().split('T')[0],
    p_reason: reason || null,
  });

  if (error) {
    console.error('Error checking FRL eligibility:', error);
    return {
      is_eligible: false,
      message: 'Error checking eligibility',
      months_employed: 0,
      work_days_per_week: 0,
    };
  }

  return data?.[0] || {
    is_eligible: false,
    message: 'Unable to check eligibility',
    months_employed: 0,
    work_days_per_week: 0,
  };
}

/**
 * Validate leave request against SA labour law
 */
export async function validateSALeaveRequest(
  userId: string,
  leaveTypeId: string,
  startDate: string,
  endDate: string,
  reason?: string
): Promise<{
  is_valid: boolean;
  message: string;
  working_days: number;
  requires_medical_cert: boolean;
}> {
  const supabase = createClient();

  // @ts-ignore - Supabase RPC types
  const { data, error } = await supabase.rpc('validate_sa_leave_request', {
    p_user_id: userId,
    p_leave_type_id: leaveTypeId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_reason: reason || null,
  });

  if (error) {
    console.error('Error validating request:', error);
    return {
      is_valid: false,
      message: 'Error validating request',
      working_days: 0,
      requires_medical_cert: false,
    };
  }

  return data?.[0] || {
    is_valid: false,
    message: 'Unable to validate',
    working_days: 0,
    requires_medical_cert: false,
  };
}

/**
 * Get public holidays for a year
 */
export async function getPublicHolidays(year: number): Promise<Array<{
  id: string;
  name: string;
  date: string;
  is_observed: boolean;
  original_date: string | null;
}>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('public_holidays')
    .select('*')
    .eq('year', year)
    .order('date');

  if (error) {
    console.error('Error fetching public holidays:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if a date is a public holiday
 */
export async function isPublicHoliday(date: string): Promise<boolean> {
  const supabase = createClient();

  const { data } = await supabase
    .from('public_holidays')
    .select('id')
    .eq('date', date)
    .eq('is_observed', true)
    .single();

  return !!data;
}



