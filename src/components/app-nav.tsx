'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Target, CheckSquare, AlertCircle,
  LineChart, Video, History, Settings, LogOut, Moon, Sun,
  Compass, Heart, Users, UserCheck, FileText,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { signOut } from '@/app/login/actions';

const sections = [
  {
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Strategy',
    items: [
      { href: '/vto', label: 'V/TO', icon: Compass },
      { href: '/core-values', label: 'Core Values', icon: Heart },
    ],
  },
  {
    label: 'Execution',
    items: [
      { href: '/rocks', label: 'Rocks', icon: Target },
      { href: '/scorecard', label: 'Scorecard', icon: LineChart },
      { href: '/todos', label: 'To-Dos', icon: CheckSquare },
      { href: '/issues', label: 'Issues', icon: AlertCircle },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/accountability', label: 'Accountability', icon: Users },
      { href: '/people', label: 'People Analyzer', icon: UserCheck },
      { href: '/processes', label: 'Processes', icon: FileText },
    ],
  },
  {
    label: 'Meetings',
    items: [
      { href: '/meeting/live', label: 'L10 Live', icon: Video },
      { href: '/meeting/history', label: 'History', icon: History },
    ],
  },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  return (
    <nav className="w-60 border-r h-screen flex flex-col p-3 gap-1 bg-background">
      <div className="px-2 py-3 font-semibold text-lg">Colorhub EOS</div>
      {sections.map((section, si) => (
        <div key={si} className={si > 0 ? 'mt-3' : ''}>
          {section.label && (
            <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {section.label}
            </div>
          )}
          {section.items.map(({ href, label, icon: Icon }) => {
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
        </div>
      ))}
      <div className="mt-auto pt-2 border-t space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent',
            pathname.startsWith('/settings') && 'bg-accent font-medium'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent w-full text-muted-foreground"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          onClick={async () => {
            await signOut();
            router.push('/login');
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent w-full text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </nav>
  );
}
