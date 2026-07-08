import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label, value, icon: Icon, tone = "default", sub,
}: {
  label: string; value: string; icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive" | "primary";
  sub?: string;
}) {
  const toneMap: Record<string, string> = {
    default: "bg-muted text-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-start gap-4">
        <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold tabular-nums text-foreground mt-1 truncate">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
