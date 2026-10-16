import { Badge } from "@/components/ui/badge";
import type { CustomerStatus, MatchStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/** Human-readable journey labels — neutral, not judgmental. */
const customerLabels: Record<CustomerStatus, string> = {
  NEW: "New",
  PROFILE_INCOMPLETE: "Profile incomplete",
  READY_FOR_MATCHING: "Ready for matching",
  MATCHES_SUGGESTED: "Matches suggested",
  INTRODUCTION_SENT: "Introduction sent",
  AWAITING_FEEDBACK: "Awaiting feedback",
  ON_HOLD: "On hold",
};

const matchLabels: Record<MatchStatus, string> = {
  SUGGESTED: "Suggested",
  SHORTLISTED: "Shortlisted",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  WITHDRAWN: "Withdrawn",
};

const customerStatusStyles: Record<CustomerStatus, string> = {
  NEW: "bg-stone-100 text-stone-700 ring-1 ring-stone-200/80",
  PROFILE_INCOMPLETE: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80",
  READY_FOR_MATCHING: "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80",
  MATCHES_SUGGESTED: "bg-sky-50 text-sky-900 ring-1 ring-sky-200/80",
  INTRODUCTION_SENT: "bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200/80",
  AWAITING_FEEDBACK: "bg-violet-50 text-violet-900 ring-1 ring-violet-200/80",
  ON_HOLD: "bg-orange-50 text-orange-900 ring-1 ring-orange-200/80",
};

const matchStatusStyles: Record<MatchStatus, string> = {
  SUGGESTED: "bg-stone-100 text-stone-700 ring-1 ring-stone-200/80",
  SHORTLISTED: "bg-sky-50 text-sky-900 ring-1 ring-sky-200/80",
  SENT: "bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200/80",
  ACCEPTED: "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80",
  DECLINED: "bg-rose-50 text-rose-900 ring-1 ring-rose-200/80",
  WITHDRAWN: "bg-orange-50 text-orange-900 ring-1 ring-orange-200/80",
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "border-0 font-medium shadow-none",
        customerStatusStyles[status],
      )}
    >
      {customerLabels[status]}
    </Badge>
  );
}

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "border-0 font-medium shadow-none",
        matchStatusStyles[status],
      )}
    >
      {matchLabels[status]}
    </Badge>
  );
}
