import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description?: string;
  trend?: { value: string; positive: boolean };
  loading?: boolean;
  className?: string;
  delay?: number;
}

export function StatCard({ icon, title, value, description, trend, loading, className, delay = 0 }: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20 mb-1" />
          {description && <Skeleton className="h-3 w-16" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden opacity-0 animate-slide-up transition-shadow hover:shadow-md",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold font-display tracking-tight">{value}</span>
          {trend && (
            <span className={cn("text-xs font-medium mb-0.5", trend.positive ? "text-success" : "text-destructive")}>
              {trend.value}
            </span>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}
