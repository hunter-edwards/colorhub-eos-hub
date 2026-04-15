'use client';
import { useState } from 'react';
import { signInWithMagicLink } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Colorhub EOS Hub</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm">
              Check your email for the sign-in link. It&apos;s valid for 1 hour.
            </p>
          ) : (
            <form
              action={async (fd) => {
                setError(null);
                setPending(true);
                const r = await signInWithMagicLink(fd);
                setPending(false);
                if ('ok' in r) setSent(true);
                else setError(r.error ?? 'Something went wrong');
              }}
              className="flex flex-col gap-3"
            >
              <Input
                name="email"
                type="email"
                required
                placeholder="you@colorhub.com"
                autoComplete="email"
              />
              <Button type="submit" disabled={pending}>
                {pending ? 'Sending…' : 'Send magic link'}
              </Button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
