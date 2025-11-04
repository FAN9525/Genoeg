// Date utility functions for leave calculations
import { differenceInBusinessDays, format, isWeekend, parseISO } from 'date-fns';

/**
 * Calculate the number of business days between two dates
 * Excludes weekends (Saturday and Sunday)
 */
export function calculateBusinessDays(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  // Add 1 to include both start and end dates
  return differenceInBusinessDays(end, start) + 1;
}

/**
 * Format a date string for display
 */
export function formatDate(date: string | Date, formatStr: string = 'PPP'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

/**
 * Format a date range for display
 */
export function formatDateRange(startDate: string | Date, endDate: string | Date): string {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
}

/**
 * Check if a date is a weekend
 */
export function isWeekendDay(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isWeekend(d);
}

/**
 * Convert a date to ISO format string (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get the current year
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

