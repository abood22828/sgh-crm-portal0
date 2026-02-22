/**
 * TableSkeleton Component
 * 
 * Skeleton loading state for tables with customizable rows and columns
 */

import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="w-full">
      {/* Header skeleton */}
      <div className="flex gap-4 items-center pb-3 border-b mb-3">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={`header-${colIndex}`}
            className="h-4 flex-1"
          />
        ))}
      </div>
      {/* Row skeletons */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 items-center py-1">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={`h-8 flex-1 ${colIndex === 0 ? 'max-w-[180px]' : ''}`}
                style={{
                  animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
