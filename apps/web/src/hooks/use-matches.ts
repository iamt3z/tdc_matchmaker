"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generateAiInsights,
  generateAiIntroduction,
  generateMatches,
  listMatchesForCustomer,
  sendMatch,
  updateMatchStatus,
} from "@/lib/api/matches";
import type { MatchStatus } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

export function useCustomerMatches(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.matches.byCustomer(customerId ?? ""),
    queryFn: () => listMatchesForCustomer(customerId!),
    enabled: Boolean(customerId),
  });
}

export function useGenerateMatches(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (opts?: { limit?: number; includeUnverified?: boolean }) =>
      generateMatches({
        customerId,
        limit: opts?.limit ?? 10,
        includeUnverified: opts?.includeUnverified ?? false,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.matches.byCustomer(customerId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(customerId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customers.all,
      });
    },
  });
}

export function useUpdateMatchStatus(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      matchId: string;
      status: Exclude<MatchStatus, "SENT">;
      feedback?: string;
    }) => updateMatchStatus(input.matchId, input.status, input.feedback),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.matches.byCustomer(customerId),
      });
    },
  });
}

export function useSendMatch(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) => sendMatch(matchId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.matches.byCustomer(customerId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(customerId),
      });
    },
  });
}

/** LLM insights for one match — does not change scores or status. */
export function useAiInsights() {
  return useMutation({
    mutationFn: (matchId: string) => generateAiInsights(matchId),
  });
}

/** LLM introduction draft — review only; does not email or send the match. */
export function useAiIntroduction() {
  return useMutation({
    mutationFn: (matchId: string) => generateAiIntroduction(matchId),
  });
}
