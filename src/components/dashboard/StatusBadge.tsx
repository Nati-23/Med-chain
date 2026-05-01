import { cn } from "@/lib/utils";
import type { RxStatus } from "@/lib/mock-data";

const styles: Record<RxStatus, string> = {
  active: "bg-[hsl(var(--verify))]/10 text-[hsl(var(--verify))] border-[hsl(var(--verify))]/30",
  expired: "bg-destructive/10 text-destructive border-destructive/30",
  used: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400",
};

const labels: Record<RxStatus, string> = {
  active: "Active",
  expired: "Expired",
  used: "Dispensed",
};

export const StatusBadge = ({ status, className }: { status: RxStatus; className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono-tight",
      styles[status],
      className,
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {labels[status]}
  </span>
);
