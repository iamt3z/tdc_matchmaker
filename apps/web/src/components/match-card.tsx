"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MatchStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  useAiInsights,
  useAiIntroduction,
  useSendMatch,
  useUpdateMatchStatus,
} from "@/hooks/use-matches";
import { getApiErrorMessage } from "@/lib/api/client";
import type { AiMatchInsights } from "@/lib/api/matches";
import type { MatchStatus } from "@/lib/api/types";
import { formatEnum } from "@/lib/format";
import { AiInsightsPanel } from "./ai-insights-panel";
import { AiIntroductionDraft } from "./ai-introduction-draft";
import type { Candidate, Match } from "./types";

const STATUS_ACTIONS: Partial<
  Record<MatchStatus, Array<Exclude<MatchStatus, "SENT">>>
> = {
  SUGGESTED: ["SHORTLISTED", "DECLINED", "WITHDRAWN"],
  SHORTLISTED: ["DECLINED", "WITHDRAWN"],
  SENT: ["ACCEPTED", "DECLINED", "WITHDRAWN"],
};

type Props = {
  customerId: string;
  match: Match;
  candidate: Candidate;
};

export function MatchCard({ customerId, match, candidate }: Props) {
  const [insights, setInsights] = useState<AiMatchInsights | null>(null);
  const [intro, setIntro] = useState<string | null>(null);

  const updateStatus = useUpdateMatchStatus(customerId);
  const send = useSendMatch(customerId);
  const aiInsights = useAiInsights();
  const aiIntroduction = useAiIntroduction();

  const aiBusy = aiInsights.isPending || aiIntroduction.isPending;

  async function handleStatus(status: Exclude<MatchStatus, "SENT">) {
    try {
      await updateStatus.mutateAsync({ matchId: match.id, status });
      toast.success(`Marked as ${formatEnum(status)}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleSend() {
    try {
      const result = await send.mutateAsync(match.id);
      toast.success(
        result.simulated
          ? "Send simulated — no email was delivered"
          : result.message,
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleAiInsights() {
    try {
      const result = await aiInsights.mutateAsync(match.id);
      setInsights(result);
      toast.success("Insights ready — please review before acting");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleAiIntroduction() {
    try {
      const result = await aiIntroduction.mutateAsync(match.id);
      setIntro(result.introduction);
      toast.success("Draft ready — edit before you use it");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <article className="space-y-4 rounded-xl border border-border/70 bg-background/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            {candidate.firstName}
            <span className="font-normal text-muted-foreground">
              , {candidate.age}
            </span>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {[candidate.city, candidate.designation, candidate.degree]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {match.score}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              rules score
            </p>
          </div>
          <MatchStatusBadge status={match.status} />
        </div>
      </div>

      <div>
        <p className="text-sm leading-relaxed text-foreground/90">
          {match.explanation.summary}
        </p>
        {match.explanation.strengths.length > 0 && (
          <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
            {match.explanation.strengths.slice(0, 4).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
        {match.explanation.considerations.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Points to explore:{" "}
            {match.explanation.considerations.slice(0, 3).join("; ")}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(match.status === "SUGGESTED" || match.status === "SHORTLISTED") && (
          <Button
            size="sm"
            onClick={() => void handleSend()}
            disabled={send.isPending}
          >
            Mark as sent (simulated)
          </Button>
        )}
        {(STATUS_ACTIONS[match.status] ?? []).map((next) => (
          <Button
            key={next}
            size="sm"
            variant={
              next === "DECLINED" || next === "WITHDRAWN"
                ? "outline"
                : "secondary"
            }
            disabled={updateStatus.isPending}
            onClick={() => void handleStatus(next)}
          >
            {formatEnum(next)}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          className="text-violet-800 hover:bg-violet-50 hover:text-violet-900"
          disabled={aiBusy}
          onClick={() => void handleAiInsights()}
        >
          {aiInsights.isPending && (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
          )}
          AI insights
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-violet-800 hover:bg-violet-50 hover:text-violet-900"
          disabled={aiBusy}
          onClick={() => void handleAiIntroduction()}
        >
          {aiIntroduction.isPending && (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
          )}
          Draft introduction
        </Button>
      </div>

      {insights && <AiInsightsPanel insights={insights} />}

      {intro !== null && (
        <AiIntroductionDraft value={intro} onChange={setIntro} />
      )}
    </article>
  );
}
