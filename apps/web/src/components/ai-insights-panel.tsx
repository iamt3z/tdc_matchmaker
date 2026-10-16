import { SourceLabel } from "@/components/feedback";
import type { AiMatchInsights } from "@/lib/api/matches";

export function AiInsightsPanel({ insights }: { insights: AiMatchInsights }) {
  return (
    <div className="space-y-2.5 rounded-lg border border-violet-200/80 bg-violet-50/40 p-3.5 dark:border-violet-900 dark:bg-violet-950/25">
      <div className="flex flex-wrap items-center gap-2">
        <SourceLabel source="ai" />
        <span className="text-[10px] text-muted-foreground">
          {insights.model}
        </span>
      </div>
      <p className="text-sm leading-relaxed">{insights.summary}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-foreground">
            Strengths to consider
          </p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
            {insights.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">
            Conversation starters
          </p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
            {insights.discussionPoints.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
      {insights.uncertainties.length > 0 && (
        <div>
          <p className="text-xs font-medium text-foreground">Uncertainties</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
            {insights.uncertainties.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}