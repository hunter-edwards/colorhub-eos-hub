import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getRock, listSubtasks, listActivity } from '@/server/rocks';
import { Subtasks } from './subtasks';
import { Activity } from './activity';

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

const STATUS_BADGE = {
  on_track: { label: 'On Track', variant: 'default' as const },
  off_track: { label: 'Off Track', variant: 'destructive' as const },
  done: { label: 'Done', variant: 'secondary' as const },
};

export default async function RockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [rock, subtasks, activity] = await Promise.all([
    getRock(id),
    listSubtasks(id),
    listActivity(id),
  ]);

  if (!rock) notFound();

  const statusInfo = STATUS_BADGE[rock.status];

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/rocks"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Rocks
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{rock.title}</h1>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
        {rock.description && (
          <p className="text-muted-foreground">{rock.description}</p>
        )}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Owner: {rock.ownerName || rock.ownerEmail}</span>
          <span>Quarter: {rock.quarter}</span>
          {rock.dueDate && (() => {
            const dl = daysLeft(rock.dueDate);
            return (
              <span className={dl.urgent ? 'text-red-600 font-medium' : ''}>
                {dl.text}
              </span>
            );
          })()}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span>{rock.progressPct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${rock.progressPct}%` }}
          />
        </div>
      </div>

      <Subtasks rockId={id} subtasks={subtasks} />

      <Activity rockId={id} activity={activity} />
    </div>
  );
}
