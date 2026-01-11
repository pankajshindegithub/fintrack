import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: ReactNode;
  variant?: "default" | "income" | "expense" | "primary";
}

export function StatCard({ title, value, change, icon, variant = "default" }: StatCardProps) {
  const isPositive = change && change > 0;
  
  return (
    <div
      className={cn(
        "stat-card group",
        variant === "income" && "stat-card-income",
        variant === "expense" && "stat-card-expense",
        variant === "primary" && "stat-card-primary",
        variant === "default" && "bg-card border border-border"
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className={cn(
            "text-sm font-medium",
            variant === "default" ? "text-muted-foreground" : "text-white/80"
          )}>
            {title}
          </span>
          <div className={cn(
            "p-2 rounded-lg",
            variant === "default" ? "bg-muted" : "bg-white/20"
          )}>
            {icon}
          </div>
        </div>
        
        <p className={cn(
          "text-3xl font-bold mb-2",
          variant === "default" ? "text-foreground" : "text-white"
        )}>
          {value}
        </p>
        
        {change !== undefined && (
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className={cn(
                "h-4 w-4",
                variant === "default" ? "text-income" : "text-white"
              )} />
            ) : (
              <TrendingDown className={cn(
                "h-4 w-4",
                variant === "default" ? "text-expense" : "text-white"
              )} />
            )}
            <span className={cn(
              "text-sm font-medium",
              variant === "default" 
                ? isPositive ? "text-income" : "text-expense"
                : "text-white/90"
            )}>
              {isPositive ? "+" : ""}{change}% from last month
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
