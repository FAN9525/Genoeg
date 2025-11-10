// Sidebar component for dashboard navigation
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FileText, CalendarDays, Users, PlusCircle, Shield, Clock, CalendarClock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Request Leave',
    href: '/request-leave',
    icon: PlusCircle,
  },
  {
    title: 'My Leaves',
    href: '/my-leaves',
    icon: FileText,
  },
  {
    title: 'My Schedule',
    href: '/my-schedule',
    icon: CalendarClock,
  },
  {
    title: 'Team Calendar',
    href: '/team-calendar',
    icon: CalendarDays,
  },
];

const adminNavItems = [
  {
    title: 'Admin Dashboard',
    href: '/admin',
    icon: Shield,
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Approve Leaves',
    href: '/admin/approvals',
    icon: Clock,
  },
  {
    title: 'Work Schedule',
    href: '/admin/work-schedule',
    icon: CalendarDays,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';

  return (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Leave Management
        </h2>
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                pathname === item.href
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </div>
      </div>

      {isManagerOrAdmin && (
        <>
          <Separator className="mx-3" />
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-primary">
              {isAdmin ? 'Administration' : 'Management'}
            </h2>
            <div className="space-y-1">
              {isAdmin ? (
                adminNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                      pathname === item.href
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                ))
              ) : (
                <Link
                  href="/admin/approvals"
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                    pathname === '/admin/approvals'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <Clock className="h-4 w-4" />
                  Approve Leaves
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

