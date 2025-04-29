import { Skeleton } from "@/components/ui/skeleton";

export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <div className="p-5">
        <div className="space-y-4">
          {/* Header with title and status */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          
          {/* Category and location */}
          <div className="flex flex-wrap gap-3 items-center mt-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          
          {/* Footer with budget and details */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}