'use client';

import { useActionState, useState } from 'react';
import { toast } from 'sonner';
import { updateProfile } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/user-avatar';

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#ec4899',
] as const;

type ProfileData = {
  name: string | null;
  avatarUrl: string | null;
  profileColor: string | null;
};

export function ProfileForm({ initial }: { initial: ProfileData }) {
  const [name, setName] = useState(initial.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? '');
  const [profileColor, setProfileColor] = useState(initial.profileColor ?? '#6366f1');

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; ok?: true } | null, formData: FormData) => {
      const result = await updateProfile(formData);
      if ('ok' in result) {
        toast.success('Profile updated');
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
      return result;
    },
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <UserAvatar
          user={{ name: name || null, avatarUrl: avatarUrl || null, profileColor }}
          size="lg"
        />
        <div className="text-sm text-muted-foreground">
          Preview of your avatar
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-name">Display name</Label>
        <Input
          id="profile-name"
          name="name"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-avatar-url">Avatar URL</Label>
        <Input
          id="profile-avatar-url"
          name="avatarUrl"
          type="url"
          placeholder="https://example.com/photo.jpg"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Paste a public image URL. Leave empty to use initials.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Profile color</Label>
        <input type="hidden" name="profileColor" value={profileColor} />
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setProfileColor(color)}
              className="rounded-full transition-all"
              style={{
                width: 32,
                height: 32,
                backgroundColor: color,
                outline: profileColor === color ? '2px solid currentColor' : 'none',
                outlineOffset: 2,
              }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? 'Saving...' : 'Save profile'}
      </Button>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-600">Profile updated.</p>}
    </form>
  );
}
