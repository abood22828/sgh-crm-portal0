import { Skeleton } from './ui/skeleton';

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-slate-50/80" dir="rtl">
      {/* Sidebar skeleton - desktop only */}
      <div className="hidden lg:flex w-60 border-l border-border/50 bg-card flex-col">
        {/* Logo area */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
          <Skeleton className="h-10 w-10 rounded-md flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>

        {/* Menu items */}
        <div className="flex-1 p-2 space-y-4">
          {[1, 2, 3, 4].map(group => (
            <div key={group} className="space-y-1">
              <Skeleton className="h-3 w-16 mx-2.5 mb-1" />
              {[1, 2, 3].map(item => (
                <Skeleton key={item} className="h-9 w-full rounded-md" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="bg-white/80 border-b border-border/40 px-4 py-2.5 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-md lg:hidden" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-48 hidden sm:block" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20 hidden md:block" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        </div>

        {/* Content blocks */}
        <div className="flex-1 p-4 md:p-6 space-y-4">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>

      {/* Mobile bottom nav skeleton */}
      <div className="lg:hidden fixed bottom-0 right-0 left-0 bg-card border-t border-border/50 px-1 py-1.5">
        <div className="flex items-center justify-around">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-2 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
