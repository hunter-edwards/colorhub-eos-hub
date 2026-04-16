'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { saveWebhookUrl, testWebhook } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function WebhookForm({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(null);
    setSaving(true);
    const r = await saveWebhookUrl(url);
    setSaving(false);
    if ('ok' in r) {
      setSuccess('Webhook URL saved.');
      toast.success('Webhook URL saved');
    } else {
      setError(r.error ?? 'Something went wrong');
      toast.error(r.error ?? 'Something went wrong');
    }
  }

  async function handleTest() {
    setError(null);
    setSuccess(null);
    setTesting(true);
    const r = await testWebhook();
    setTesting(false);
    if ('ok' in r) {
      setSuccess('Test message sent! Check your Teams channel.');
      toast.success('Test message sent');
    } else {
      setError(r.error ?? 'Test failed');
      toast.error(r.error ?? 'Test failed');
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="webhook-url">Microsoft Teams Webhook URL</Label>
      <Input
        id="webhook-url"
        type="url"
        placeholder="https://outlook.office.com/webhook/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        Paste an Incoming Webhook URL from your Teams channel. Meeting summaries
        will be posted here automatically.
      </p>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} className="w-fit">
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={testing || !url.trim()}
          className="w-fit"
        >
          {testing ? 'Sending…' : 'Send test post'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}
    </div>
  );
}
