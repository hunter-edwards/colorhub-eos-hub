import { cn } from '@/lib/utils';

type UserAvatarProps = {
  user: {
    name?: string | null;
    avatarUrl?: string | null;
    profileColor?: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
} as const;

const textSizeMap = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-base',
} as const;

function getInitial(name?: string | null): string {
  if (!name || name.trim().length === 0) return '?';
  return name.trim()[0].toUpperCase();
}

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const px = sizeMap[size];

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name ?? 'User avatar'}
        className={cn('rounded-full object-cover shrink-0', className)}
        style={{ width: px, height: px }}
      />
    );
  }

  const bgColor = user.profileColor ?? '#6366f1';

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium text-white shrink-0 select-none',
        textSizeMap[size],
        className,
      )}
      style={{ width: px, height: px, backgroundColor: bgColor }}
      aria-label={user.name ?? 'User'}
    >
      {getInitial(user.name)}
    </span>
  );
}
