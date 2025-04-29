import { Skeleton } from "@/components/ui/skeleton";

export function FreelancerCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Avatar skeleton */}
          <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
          
          <div className="flex-1 space-y-3">
            {/* Name and rating skeleton */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-5 w-24" />
            </div>
            
            {/* Title skeleton */}
            <Skeleton className="h-5 w-full max-w-md" />
            
            {/* Skills skeleton */}
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-full" />
              ))}
            </div>
            
            {/* Bottom info skeleton */}
            <div className="flex items-center justify-between mt-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-9 w-36 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}