import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LoadingSkeletonProps {
  count?: number;
}

const LoadingSkeleton = ({ count = 6 }: LoadingSkeletonProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LoadingSkeleton;