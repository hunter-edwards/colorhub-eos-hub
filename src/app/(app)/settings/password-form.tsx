'use client';
import { useState } from 'react';
import { updatePassword } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (fd) => {
        setError(null);
        setSuccess(false);
        setPending(true);
        const r = await updatePassword(fd);
        setPending(false);
        if ('ok' in r) {
          setSuccess(true);
          (document.getElementById('password-form') as HTMLFormElement | null)?.reset();
        } else {
          setError(r.error ?? 'Something went wrong');
        }
      }}
      id="password-form"
      className="flex flex-col gap-3"
    >
      <Label htmlFor="new-password">New password</Label>
      <Input id="new-password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      <Label htmlFor="confirm-password">Confirm password</Label>
      <Input id="confirm-password" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? 'Saving…' : 'Save password'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">Password updated.</p>}
    </form>
  );
}
