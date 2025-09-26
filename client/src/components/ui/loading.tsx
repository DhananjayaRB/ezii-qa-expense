import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
  fullScreen?: boolean;
  variant?: "default" | "gradient" | "pulse";
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6", 
  lg: "w-8 h-8",
  xl: "w-12 h-12"
};

const LoadingSpinner = ({ size = "md", className }: { size: LoadingProps["size"]; className?: string }) => {
  return (
    <Loader2 
      className={cn(
        "animate-spin text-primary", 
        sizeClasses[size!],
        className
      )}
      data-testid="loading-spinner"
    />
  );
};

const LoadingDots = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex space-x-1", className)} data-testid="loading-dots">
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
    </div>
  );
};

const LoadingPulse = ({ size = "md" }: { size: LoadingProps["size"] }) => {
  return (
    <div 
      className={cn(
        "bg-primary rounded-full animate-pulse",
        sizeClasses[size!]
      )}
      data-testid="loading-pulse"
    />
  );
};

export function Loading({ 
  size = "md", 
  text, 
  className, 
  fullScreen = false,
  variant = "default" 
}: LoadingProps) {
  const content = (
    <div 
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullScreen ? "min-h-screen bg-background" : "p-4",
        className
      )}
      data-testid="loading-container"
    >
      {variant === "default" && <LoadingSpinner size={size} />}
      {variant === "gradient" && (
        <div className="relative">
          <LoadingSpinner size={size} className="text-gradient" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-sm animate-pulse opacity-30" />
        </div>
      )}
      {variant === "pulse" && <LoadingPulse size={size} />}
      
      {text && (
        <p 
          className="text-sm text-muted-foreground font-medium animate-pulse"
          data-testid="loading-text"
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

// Page Loading Component for full page transitions
export function PageLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <Loading 
      size="lg" 
      text={text} 
      fullScreen={true}
      variant="gradient"
      data-testid="page-loading"
    />
  );
}

// Inline Loading for buttons and small components
export function InlineLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2" data-testid="inline-loading">
      <LoadingSpinner size="sm" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Card Loading for data sections
export function CardLoading({ text = "Loading data..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-border rounded-lg bg-card" data-testid="card-loading">
      <LoadingDots />
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

// Skeleton Loading for lists and content
export function SkeletonLoader({ 
  lines = 3, 
  className 
}: { 
  lines?: number; 
  className?: string; 
}) {
  return (
    <div className={cn("space-y-3", className)} data-testid="skeleton-loader">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        </div>
      ))}
    </div>
  );
}