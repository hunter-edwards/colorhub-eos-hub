'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { addHeadline, listHeadlines } from '@/server/meetings';

type Headline = {
  id: string;
  kind: 'customer' | 'employee';
  text: string;
  authorName: string | null;
};

export function HeadlinesPanel({ meetingId }: { meetingId: string }) {
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [customerText, setCustomerText] = useState('');
  const [employeeText, setEmployeeText] = useState('');

  useEffect(() => {
    listHeadlines(meetingId).then(setHeadlines);
  }, [meetingId]);

  async function add(kind: 'customer' | 'employee', text: string) {
    if (!text.trim()) return;
    await addHeadline(meetingId, kind, text.trim());
    const updated = await listHeadlines(meetingId);
    setHeadlines(updated);
  }

  const customer = headlines.filter((h) => h.kind === 'customer');
  const employee = headlines.filter((h) => h.kind === 'employee');

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-3">
        <h3 className="font-medium text-sm">Customer Headlines</h3>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await add('customer', customerText);
            setCustomerText('');
          }}
        >
          <Input
            placeholder="Add customer headline..."
            value={customerText}
            onChange={(e) => setCustomerText(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!customerText.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        {customer.map((h) => (
          <div key={h.id} className="text-sm px-2 py-1 rounded bg-accent">
            {h.text}
            {h.authorName && (
              <span className="text-xs text-muted-foreground ml-2">— {h.authorName}</span>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-sm">Employee Headlines</h3>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await add('employee', employeeText);
            setEmployeeText('');
          }}
        >
          <Input
            placeholder="Add employee headline..."
            value={employeeText}
            onChange={(e) => setEmployeeText(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!employeeText.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        {employee.map((h) => (
          <div key={h.id} className="text-sm px-2 py-1 rounded bg-accent">
            {h.text}
            {h.authorName && (
              <span className="text-xs text-muted-foreground ml-2">— {h.authorName}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
