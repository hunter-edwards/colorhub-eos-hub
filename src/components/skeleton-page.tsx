function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ''}`} />;
}

export function CardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <Bone className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Bone key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Bone className="h-4 w-4 rounded" />
          <Bone className="h-3 flex-1" />
          <Bone className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-2">
          {Array.from({ length: cols }).map((_, c) => (
            <Bone key={c} className="h-8 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {children}
    </div>
  );
}
