import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PasswordForm } from './password-form';
import { WebhookForm } from './webhook-form';
import { getWebhookUrl } from './actions';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const webhookUrl = await getWebhookUrl();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Account and team settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Signed in as {user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teams Integration</CardTitle>
          <CardDescription>
            Post meeting summaries to a Microsoft Teams channel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WebhookForm initialUrl={webhookUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
