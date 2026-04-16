'use client';

import { useState, useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Target, ChevronDown, Plus, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { UserAvatar } from '@/components/user-avatar';
import { updateRockStatus } from '@/server/rocks';
import { NewRockDialog } from './new-rock-dialog';

type Rock = {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  quarter: string;
  status: 'on_track' | 'off_track' | 'done';
  progressPct: number;
  dueDate: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerName: string | null;
  ownerEmail: string | null;
};

type Member = { id: string; name: string | null; email: string };

const STATUS_CONFIG = {
  on_track: { label: 'On Track', color: 'bg-green-500', badgeVariant: 'default' as const },
  off_track: { label: 'Off Track', color: 'bg-red-500', badgeVariant: 'destructive' as const },
  done: { label: 'Done', color: 'bg-blue-500', badgeVariant: 'secondary' as const },
} as const;

const COLUMNS: Array<'on_track' | 'off_track' | 'done'> = ['on_track', 'off_track', 'done'];

function daysLeft(dueDate: string): { text: string; urgent: boolean } {
  const due = new Date(dueDate + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, urgent: true };
  if (diff === 0) return { text: 'Due today', urgent: true };
  if (diff === 1) return { text: '1 day left', urgent: true };
  if (diff <= 7) return { text: `${diff} days left`, urgent: true };
  return { text: `${diff} days left`, urgent: false };
}

function RockCard({ rock }: { rock: Rock }) {
  return (
    <Link href={`/rocks/${rock.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium leading-snug">
              {rock.title}
            </CardTitle>
            <StatusDropdown rockId={rock.id} current={rock.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-1.5">
            <UserAvatar user={{ name: rock.ownerName }} size="sm" />
            <span className="text-xs text-muted-foreground">
              {rock.ownerName || rock.ownerEmail}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Progress</span>
              <span>{rock.progressPct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${rock.progressPct}%` }}
              />
            </div>
          </div>
          {rock.dueDate && (() => {
            const dl = daysLeft(rock.dueDate);
            return (
              <p className={`text-xs ${dl.urgent ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                {dl.text}
              </p>
            );
          })()}
        </CardContent>
      </Card>
    </Link>
  );
}

function StatusDropdown({ rockId, current }: { rockId: string; current: string }) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(current);
  const [, startTransition] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-accent"
        onClick={(e) => e.preventDefault()}
      >
        <Badge variant={STATUS_CONFIG[optimisticStatus as keyof typeof STATUS_CONFIG].badgeVariant}>
          {STATUS_CONFIG[optimisticStatus as keyof typeof STATUS_CONFIG].label}
        </Badge>
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(e) => e.preventDefault()}>
        {COLUMNS.filter((s) => s !== optimisticStatus).map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                setOptimisticStatus(s);
                await updateRockStatus(rockId, s);
                toast.success(`Rock marked ${STATUS_CONFIG[s].label.toLowerCase()}`);
              });
            }}
          >
            <div className={`h-2 w-2 rounded-full ${STATUS_CONFIG[s].color} mr-2`} />
            {STATUS_CONFIG[s].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RocksBoard({
  rocks,
  members,
  quarter,
}: {
  rocks: Rock[];
  members: Member[];
  quarter: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Target className="mr-2 h-4 w-4" /> New Rock
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((status) => {
          const items = rocks.filter((r) => r.status === status);
          return (
            <div key={status} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${STATUS_CONFIG[status].color}`} />
                <h2 className="font-semibold text-sm">
                  {STATUS_CONFIG[status].label}
                </h2>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              {items.length === 0 && (
                <EmptyState
                  icon={Inbox}
                  title="No rocks"
                  description="Add a rock to get started"
                />
              )}
              {items.map((rock) => (
                <RockCard key={rock.id} rock={rock} />
              ))}
            </div>
          );
        })}
      </div>

      <NewRockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        members={members}
        quarter={quarter}
      />
    </>
  );
}
