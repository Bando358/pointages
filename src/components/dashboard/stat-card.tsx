"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Variant = "default" | "primary" | "success" | "warning" | "danger";

const variantStyles: Record<Variant, { card: string; icon: string }> = {
  default: {
    card: "bg-linear-to-br from-slate-50 to-slate-100/80 border-slate-200/60",
    icon: "bg-slate-100 text-slate-600",
  },
  primary: {
    card: "bg-linear-to-br from-primary/10 to-primary/5 border-primary/20",
    icon: "bg-primary/15 text-primary",
  },
  success: {
    card: "bg-linear-to-br from-emerald-50 to-teal-50/80 border-emerald-200/60",
    icon: "bg-emerald-100 text-emerald-600",
  },
  warning: {
    card: "bg-linear-to-br from-amber-50 to-orange-50/80 border-amber-200/60",
    icon: "bg-amber-100 text-amber-600",
  },
  danger: {
    card: "bg-linear-to-br from-red-50 to-rose-50/80 border-red-200/60",
    icon: "bg-red-100 text-red-600",
  },
};

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: Variant;
  trend?: { value: number; label: string };
}

export function StatCard({ title, value, description, icon: Icon, variant = "default", trend }: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn(
      "group relative rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-fade-in",
      styles.card
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          {trend && (
            <p className={cn("text-xs font-medium", trend.value >= 0 ? "text-emerald-600" : "text-red-600")}>
              {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn("rounded-lg p-2.5 transition-transform duration-300 group-hover:scale-110", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
