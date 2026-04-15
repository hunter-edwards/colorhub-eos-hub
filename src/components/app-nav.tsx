'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Target, CheckSquare, AlertCircle,
  LineChart, Video, History, Settings,
} from 'lucide-react';

const items = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/rocks', label: 'Rocks', icon: Target },
  { href: '/todos', label: 'To-Dos', icon: CheckSquare },
  { href: '/issues', label: 'Issues', icon: AlertCircle },
  { href: '/scorecard', label: 'Scorecard', icon: LineChart },
  { href: '/meeting/live', label: 'L10 Live', icon: Video },
  { href: '/meeting/history', label: 'Meeting History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="w-60 border-r h-screen flex flex-col p-3 gap-1 bg-background">
      <div className="px-2 py-3 font-semibold text-lg">Colorhub EOS</div>
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent',
              active && 'bg-accent font-medium'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
