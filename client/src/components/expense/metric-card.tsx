import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "yellow" | "green" | "purple";
  isLoading?: boolean;
  className?: string;
  "data-testid"?: string;
}

const colorMap = {
  blue: "bg-blue-100 text-blue-600",
  yellow: "bg-yellow-100 text-yellow-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
};

const iconMap = {
  "file-invoice-rupee": "fas fa-rupee-sign",
  "clock": "fas fa-clock",
  "check-circle": "fas fa-check-circle",
  "hand-holding-rupee": "fas fa-rupee-sign",
};

export default function MetricCard({ 
  title, 
  value, 
  icon, 
  color, 
  isLoading = false,
  className,
  "data-testid": testId,
}: MetricCardProps) {
  return (
    <Card className={cn("shadow-sm border border-gray-200", className)} data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1" data-testid={`text-metric-title-${testId}`}>
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900" data-testid={`text-metric-value-${testId}`}>
              {isLoading ? "..." : value}
            </p>
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", colorMap[color])}>
            <i className={cn(iconMap[icon as keyof typeof iconMap], "text-xl")}></i>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
