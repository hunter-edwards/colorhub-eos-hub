'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithMagicLink, signInWithPassword } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Login() {
  const router = useRouter();
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
          <Tabs
            defaultValue="magic"
            onValueChange={() => {
              setError(null);
              setSent(false);
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="magic">Magic link</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>

            <TabsContent value="magic" className="pt-4">
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
                  <Label htmlFor="magic-email">Email</Label>
                  <Input
                    id="magic-email"
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
            </TabsContent>

            <TabsContent value="password" className="pt-4">
              <form
                action={async (fd) => {
                  setError(null);
                  setPending(true);
                  const r = await signInWithPassword(fd);
                  setPending(false);
                  if ('ok' in r) router.push('/');
                  else setError(r.error ?? 'Something went wrong');
                }}
                className="flex flex-col gap-3"
              >
                <Label htmlFor="pw-email">Email</Label>
                <Input
                  id="pw-email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@colorhub.com"
                  autoComplete="email"
                />
                <Label htmlFor="pw-password">Password</Label>
                <Input
                  id="pw-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
                <Button type="submit" disabled={pending}>
                  {pending ? 'Signing in…' : 'Sign in'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  First time? Use the Magic link tab. After logging in, you can set a password in Settings.
                </p>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
