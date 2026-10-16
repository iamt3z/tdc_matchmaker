"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SourceLabel,
} from "@/components/feedback";
import { useCustomerMatches } from "@/hooks/use-matches";
import { getApiErrorMessage } from "@/lib/api/client";
import { MatchCard } from "./match-card";

type Props = {
  customerId: string;
  canGenerate: boolean;
};

export function MatchSuggestionsCard({ customerId, canGenerate }: Props) {
  const matchesQuery = useCustomerMatches(customerId);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">Match suggestions</CardTitle>
          <SourceLabel source="rules" />
        </div>
        <CardDescription>
          Compatibility scores come from the rules engine. Treat each suggestion
          as a starting point for your judgment — not a verdict on anyone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {matchesQuery.isLoading && (
          <LoadingState message="Loading suggestions…" />
        )}
        {matchesQuery.isError && (
          <ErrorState
            message={getApiErrorMessage(matchesQuery.error)}
            onRetry={() => void matchesQuery.refetch()}
          />
        )}
        {matchesQuery.isSuccess && matchesQuery.data.length === 0 && (
          <EmptyState
            title="No suggestions yet"
            description={
              canGenerate
                ? "Use “Suggest matches” when you are ready to review possible introductions."
                : "This profile needs to be complete and active before matches can be suggested."
            }
          />
        )}

        {matchesQuery.data?.map(({ match, candidate }) => (
          <MatchCard
            key={match.id}
            customerId={customerId}
            match={match}
            candidate={candidate}
          />
        ))}
      </CardContent>
    </Card>
  );
}