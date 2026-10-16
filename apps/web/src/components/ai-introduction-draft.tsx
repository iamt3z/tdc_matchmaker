"use client";

import { SourceLabel } from "@/components/feedback";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function AiIntroductionDraft({ value, onChange }: Props) {
  return (
    <div className="space-y-2 rounded-lg border border-border/80 bg-muted/30 p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <SourceLabel source="ai" />
        <span className="text-xs text-muted-foreground">
          Editable draft · not sent
        </span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="bg-card text-sm leading-relaxed"
        aria-label="Introduction draft"
      />
      <p className="text-xs leading-relaxed text-muted-foreground">
        This is a draft for your review. Generating it does not email anyone or
        change the match status.
      </p>
    </div>
  );
}