import { apiClient } from "./client";
import type {
  ApiSuccess,
  Match,
  MatchStatus,
  MatchSuggestion,
  SendMatchResult,
} from "./types";

export async function generateMatches(input: {
  customerId: string;
  limit?: number;
  includeUnverified?: boolean;
}): Promise<MatchSuggestion[]> {
  const { data } = await apiClient.post<ApiSuccess<MatchSuggestion[]>>(
    "/api/matches/generate",
    input,
  );
  return data.data;
}

export async function listMatchesForCustomer(
  customerId: string,
): Promise<MatchSuggestion[]> {
  const { data } = await apiClient.get<ApiSuccess<MatchSuggestion[]>>(
    `/api/matches/customer/${customerId}`,
  );
  return data.data;
}

export async function getMatch(matchId: string): Promise<MatchSuggestion> {
  const { data } = await apiClient.get<ApiSuccess<MatchSuggestion>>(
    `/api/matches/${matchId}`,
  );
  return data.data;
}

export async function updateMatchStatus(
  matchId: string,
  status: Exclude<MatchStatus, "SENT">,
  feedback?: string,
): Promise<Match> {
  const { data } = await apiClient.patch<ApiSuccess<Match>>(
    `/api/matches/${matchId}/status`,
    { status, feedback },
  );
  return data.data;
}

export async function sendMatch(matchId: string): Promise<SendMatchResult> {
  const { data } = await apiClient.post<ApiSuccess<SendMatchResult>>(
    `/api/matches/${matchId}/send`,
  );
  return data.data;
}

export interface AiMatchInsights {
  summary: string;
  strengths: string[];
  discussionPoints: string[];
  uncertainties: string[];
  model: string;
  generatedBy: "LLM";
}

export interface AiIntroduction {
  introduction: string;
  model: string;
  generatedBy: "LLM";
  draft: true;
}

/** AI explanation for a saved match. Requires server OPENROUTER_API_KEY. */
export async function generateAiInsights(
  matchId: string,
): Promise<AiMatchInsights> {
  const { data } = await apiClient.post<ApiSuccess<AiMatchInsights>>(
    `/api/matches/${matchId}/ai-insights`,
  );
  return data.data;
}

/** AI introduction draft for matchmaker review — does not send email. */
export async function generateAiIntroduction(
  matchId: string,
): Promise<AiIntroduction> {
  const { data } = await apiClient.post<ApiSuccess<AiIntroduction>>(
    `/api/matches/${matchId}/ai-introduction`,
  );
  return data.data;
}
