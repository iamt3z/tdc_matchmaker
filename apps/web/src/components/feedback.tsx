import type { ReactNode } from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Calm loading indicator for list and detail views. */
export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2.5 py-14 text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-4 animate-spin shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

/** Encouraging empty state — practical, not promotional. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/50 px-6 py-12 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
        <Inbox className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Actionable error banner — honest, not alarming. */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex gap-2.5">
        <AlertCircle
          className="mt-0.5 size-4 shrink-0 text-destructive"
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium text-destructive">
            Something went wrong
          </p>
          <p className="mt-0.5 text-sm text-destructive/90">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-md border border-destructive/30 bg-background px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/** Subtle source label: profile data | rules engine | AI assist */
export function SourceLabel({
  source,
  className,
}: {
  source: "profile" | "rules" | "ai";
  className?: string;
}) {
  const labels = {
    profile: "From profile",
    rules: "Rules-based compatibility",
    ai: "AI-assisted · for review",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        source === "ai" &&
          "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
        source === "rules" &&
          "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
        source === "profile" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {labels[source]}
    </span>
  );
}
