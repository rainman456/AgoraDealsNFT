import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const SkeletonCard: React.FC = () => {
  return (
    <Card className="overflow-hidden rounded-2xl border-0 shadow-md">
      <Skeleton className="aspect-[16/9] w-full" />
      
      <CardContent className="p-5">
        <div className="mb-3">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-5 w-20" />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <div className="flex items-center gap-1 mb-4">
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="flex items-baseline gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Skeleton className="h-12 w-full rounded-xl" />
      </CardFooter>
    </Card>
  );
};

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
