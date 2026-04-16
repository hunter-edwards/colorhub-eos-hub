'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Target, CheckSquare, AlertCircle,
  LineChart, Video, History, Settings, LogOut, Moon, Sun,
  Compass, Heart, Users, UserCheck, FileText, Menu,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { signOut } from '@/app/login/actions';
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

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

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  return (
    <>
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
                onClick={onNavigate}
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
          onClick={onNavigate}
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
    </>
  );
}

export function AppNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex w-60 border-r h-screen flex-col p-3 gap-1 bg-background">
        <div className="px-2 py-3 font-semibold text-lg">Colorhub EOS</div>
        <NavContent />
      </nav>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 border-b bg-background px-3 h-14">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" />}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle>Colorhub EOS</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col flex-1 p-3 gap-1 overflow-y-auto">
              <NavContent onNavigate={() => setOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>
        <span className="font-semibold text-lg">Colorhub EOS</span>
      </div>
    </>
  );
}
