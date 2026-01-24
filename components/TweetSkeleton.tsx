'use client';

interface TweetSkeletonProps {
  showImage?: boolean;
}

export default function TweetSkeleton({ showImage = false }: TweetSkeletonProps) {
  return (
    <article className="border-b border-border px-4 lg:px-6 py-4 bg-background">
      <div className="flex space-x-4">
        {/* Profile Picture Skeleton */}
        <div className="shrink-0">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 min-w-0">
          {/* Header Skeleton */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>

          {/* Text Content Skeleton */}
          <div className="space-y-2 mb-3">
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-muted rounded animate-pulse" />
          </div>

          {/* Optional Image Skeleton */}
          {showImage && (
            <div className="mb-3 rounded-2xl overflow-hidden border border-border">
              <div className="w-full h-64 bg-muted animate-pulse" />
            </div>
          )}

          {/* Action Buttons Skeleton */}
          <div className="flex items-center justify-between mt-4 pt-2">
            <div className="h-5 w-12 bg-muted rounded animate-pulse" />
            <div className="h-5 w-12 bg-muted rounded animate-pulse" />
            <div className="h-5 w-12 bg-muted rounded animate-pulse" />
            <div className="h-5 w-12 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </article>
  );
}
