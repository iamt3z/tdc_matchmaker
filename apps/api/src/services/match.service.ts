import { randomUUID } from "node:crypto";

import type {
  Customer,
  GenerateMatchesInput,
  Match,
  MatchExplanation,
  MatchScoreBreakdown,
  MatchStatus,
  MatchSuggestion,
  PartnerPreference,
  SendMatchResult,
  TriState,
} from "@tdc/types";

import {
  customerToMatchProfile,
  tryCustomerToMatchProfile,
  InsufficientProfileError,
} from "../features/matching/adapters/customer-to-match-profile";
import {
  calculateMatchScore,
  findMatches,
} from "../features/matching/match-engine";
import type { MatchProfile, MatchResult } from "../features/matching/match-types";
import { customerRepository } from "../repositories/customer.repository";
import { matchRepository } from "../repositories/match.repository";
import { AppError } from "../middleware/error-handler";
import { calculateAgeUtc } from "../utils/age";
import { DEFAULT_MATCH_OPTIONS } from "../features/matching/match-config";

/**
 * Status transitions for PATCH /status.
 * SENT is intentionally excluded: the mock-send endpoint owns that transition
 * so sentAt and the simulated response stay consistent.
 */
const ALLOWED_TRANSITIONS: Record<MatchStatus, MatchStatus[]> = {
  SUGGESTED: ["SHORTLISTED", "DECLINED", "WITHDRAWN"],
  SHORTLISTED: ["DECLINED", "WITHDRAWN"],
  SENT: ["ACCEPTED", "DECLINED", "WITHDRAWN"],
  ACCEPTED: [],
  DECLINED: [],
  WITHDRAWN: [],
};

/**
 * Source customers that must not request new matches.
 * PROFILE_INCOMPLETE lacks reliable preference data; ON_HOLD is paused.
 */
const BLOCKED_SOURCE_STATUSES = new Set([
  "PROFILE_INCOMPLETE",
  "ON_HOLD",
]);

/**
 * Map engine factor scores onto the shared MatchScoreBreakdown shape.
 *
 * IMPORTANT — units and semantics (do not treat as independent percentages):
 * The overall Match.score is normalized to 0–100 via
 *   round((sum of factor scores / TOTAL_MATCH_WEIGHT) * 100).
 * Each breakdown field is the **sum of raw engine-weight contributions**
 * for the factors grouped under that category (not a 0–100 percentage).
 * Category maxima differ (e.g. language ≤ 5, mutualPreferences ≤ 25).
 * Consumers should display these as relative contributions, not as
 * equal-weight percentages that sum to the overall score.
 *
 * Engine factors → categories:
 *   Children + Pets           → mutualPreferences
 *   Values                   → familyExpectations
 *   Age + Height             → lifestyle
 *   Profession + Income + Relationship goal → careerAndEducation
 *   Relocation               → locationAndRelocation
 *   Languages                → language
 */
function toScoreBreakdown(result: MatchResult): MatchScoreBreakdown {
  const scoreOf = (factor: string): number => {
    const reason = result.reasons.find(
      (r) => r.factor.toLowerCase() === factor.toLowerCase(),
    );
    return reason?.score ?? 0;
  };

  return {
    mutualPreferences: scoreOf("Children") + scoreOf("Pets"),
    familyExpectations: scoreOf("Values"),
    lifestyle: scoreOf("Age") + scoreOf("Height"),
    careerAndEducation:
      scoreOf("Profession") +
      scoreOf("Income") +
      scoreOf("Relationship goal"),
    locationAndRelocation: scoreOf("Relocation"),
    language: scoreOf("Languages"),
  };
}

/**
 * Build a rules-based explanation from engine output.
 * generatedBy remains "RULES" — no LLM is invoked.
 */
function toExplanation(result: MatchResult): MatchExplanation {
  const strengths = result.reasons
    .filter((reason) => reason.score >= reason.maxScore * 0.75)
    .map((reason) => reason.explanation);

  const considerations = result.potentialDifferences;

  const summary =
    strengths.length > 0
      ? `Compatibility score ${result.score}/100. ${strengths[0]}`
      : `Compatibility score ${result.score}/100 with limited strong alignment factors.`;

  return {
    summary,
    strengths,
    considerations,
    generatedBy: "RULES",
  };
}

/**
 * Minimal candidate card for MatchSuggestion responses.
 * Fields match the shared MatchSuggestion.candidate shape exactly.
 */
function toCandidateCard(customer: Customer, age: number) {
  return {
    id: customer.id,
    firstName: customer.firstName,
    age,
    city: customer.location.city,
    heightCm: customer.heightCm,
    degree:
      customer.education?.degree ??
      customer.education?.highestQualification,
    designation: customer.employment?.designation,
    introduction: customer.introduction,
  };
}

/**
 * TriState gate for REQUIRED partner preferences.
 *
 * Conservative rule: uncertainty is not confirmed compatibility.
 * - Exact match (including both MAYBE) passes.
 * - YES vs NO fails.
 * - REQUIRED YES or NO vs candidate MAYBE fails (cannot confirm).
 * - REQUIRED MAYBE only fails against a hard opposite is unnecessary;
 *   MAYBE required accepts any candidate value (preference is soft intent).
 */
function requiredTriStateFails(required: TriState, actual: TriState): boolean {
  if (required === "MAYBE") {
    return false;
  }
  // REQUIRED YES or NO demands a confirmed matching answer.
  return actual !== required;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Enforce partnerPreferences marked REQUIRED as hard eligibility rules.
 *
 * PREFERRED and FLEXIBLE are left to the engine soft-scoring path.
 * When a REQUIRED value cannot be evaluated (missing candidate data),
 * the candidate is rejected rather than assumed compatible.
 */
function meetsRequiredPreferences(
  source: Customer,
  candidate: Customer,
): boolean {
  const prefs = source.partnerPreferences;
  if (!prefs) return true;

  const isRequired = <T>(
    pref: PartnerPreference<T> | undefined,
  ): pref is PartnerPreference<T> => pref?.importance === "REQUIRED";

  // REQUIRED age range — candidate age must fall inside the bounds.
  if (isRequired(prefs.ageRange)) {
    const age = calculateAgeUtc(candidate.dateOfBirth);
    const { min, max } = prefs.ageRange.value;
    if (age < min || age > max) return false;
  }

  // REQUIRED height range — missing candidate height cannot satisfy a hard requirement.
  if (isRequired(prefs.height)) {
    if (candidate.heightCm === undefined) return false;
    const { minCm, maxCm } = prefs.height.value;
    if (minCm !== undefined && candidate.heightCm < minCm) return false;
    if (maxCm !== undefined && candidate.heightCm > maxCm) return false;
  }

  // REQUIRED marital status list.
  if (isRequired(prefs.maritalStatuses)) {
    if (!prefs.maritalStatuses.value.includes(candidate.maritalStatus)) {
      return false;
    }
  }

  // REQUIRED children — MAYBE does not satisfy a hard YES/NO requirement.
  if (isRequired(prefs.wantsChildren)) {
    if (requiredTriStateFails(prefs.wantsChildren.value, candidate.wantsChildren)) {
      return false;
    }
  }

  // REQUIRED relocation.
  if (isRequired(prefs.openToRelocation)) {
    if (
      requiredTriStateFails(
        prefs.openToRelocation.value,
        candidate.openToRelocation,
      )
    ) {
      return false;
    }
  }

  // REQUIRED pets.
  if (isRequired(prefs.openToPets)) {
    if (requiredTriStateFails(prefs.openToPets.value, candidate.openToPets)) {
      return false;
    }
  }

  // REQUIRED languages — at least one preferred language known.
  if (isRequired(prefs.languages) && prefs.languages.value.length > 0) {
    const candidateLangs = new Set(
      (candidate.languagesKnown ?? []).map(normalize),
    );
    const anyMatch = prefs.languages.value.some((lang) =>
      candidateLangs.has(normalize(lang)),
    );
    if (!anyMatch) return false;
  }

  // REQUIRED professions — candidate designation must appear in the list.
  if (isRequired(prefs.professions) && prefs.professions.value.length > 0) {
    const designation = candidate.employment?.designation;
    if (!designation) return false;
    const allowed = new Set(prefs.professions.value.map(normalize));
    if (!allowed.has(normalize(designation))) return false;
  }

  // REQUIRED family values — at least one shared value.
  if (isRequired(prefs.familyValues) && prefs.familyValues.value.length > 0) {
    const candidateValues = new Set(
      (candidate.family?.familyValues ?? []).map(normalize),
    );
    const anyMatch = prefs.familyValues.value.some((v) =>
      candidateValues.has(normalize(v)),
    );
    if (!anyMatch) return false;
  }

  // REQUIRED locations:
  // If the preference entry specifies a non-empty city, country alone is not enough.
  // Country-only preferences (empty/missing city) match on country.
  if (isRequired(prefs.locations) && prefs.locations.value.length > 0) {
    const city = normalize(candidate.location.city);
    const country = normalize(candidate.location.country);
    const anyMatch = prefs.locations.value.some((loc) => {
      const prefCity = loc.city?.trim() ? normalize(loc.city) : "";
      const prefCountry = normalize(loc.country);
      if (prefCity) {
        return prefCity === city && prefCountry === country;
      }
      return prefCountry === country;
    });
    if (!anyMatch) return false;
  }

  // REQUIRED religion — exact case-insensitive match; missing candidate value fails.
  if (isRequired(prefs.religion)) {
    if (!candidate.religion) return false;
    if (normalize(candidate.religion) !== normalize(prefs.religion.value)) {
      return false;
    }
  }

  // REQUIRED caste/community — exact case-insensitive match; missing fails.
  if (isRequired(prefs.casteOrCommunity)) {
    if (!candidate.casteOrCommunity) return false;
    if (
      normalize(candidate.casteOrCommunity) !==
      normalize(prefs.casteOrCommunity.value)
    ) {
      return false;
    }
  }

  // REQUIRED education levels — match against degree or highestQualification.
  if (isRequired(prefs.educationLevels) && prefs.educationLevels.value.length > 0) {
    const candidateLevels = [
      candidate.education?.degree,
      candidate.education?.highestQualification,
    ]
      .filter((v): v is string => Boolean(v))
      .map(normalize);

    if (candidateLevels.length === 0) return false;

    const allowed = new Set(prefs.educationLevels.value.map(normalize));
    if (!candidateLevels.some((level) => allowed.has(level))) return false;
  }

  // REQUIRED dietary preferences — at least one overlap with lifestyle diets.
  if (
    isRequired(prefs.dietaryPreferences) &&
    prefs.dietaryPreferences.value.length > 0
  ) {
    const candidateDiets = new Set(
      (candidate.lifestyle?.dietaryPreferences ?? []).map(normalize),
    );
    if (candidateDiets.size === 0) return false;
    const anyMatch = prefs.dietaryPreferences.value.some((d) =>
      candidateDiets.has(normalize(d)),
    );
    if (!anyMatch) return false;
  }

  // additionalPreferences may be REQUIRED, but the domain model does not define
  // how arbitrary key/value pairs map onto candidate biodata. Inventing a
  // comparison rule would be unsafe — those entries are intentionally skipped.

  return true;
}

/**
 * Service-level eligibility that preserves factual verification on the profile.
 *
 * When includeUnverified is false, only VERIFIED domain candidates pass.
 * When true, unverified candidates may pass, but isVerified on the adapted
 * profile remains false so explanations and downstream data stay honest.
 *
 * Gender, availability, and self-match rules mirror the engine.
 * Age/height/income hard bounds are left to the engine (or calculateMatchScore
 * path after this gate) via the adapted preferences.
 */
function passesServiceEligibility(
  source: Customer,
  candidate: Customer,
  includeUnverified: boolean,
): boolean {
  if (candidate.id === source.id) return false;

  // Opposite-gender only; OTHER is excluded by the adapter.
  if (candidate.gender === source.gender) return false;
  if (candidate.gender === "OTHER" || source.gender === "OTHER") return false;

  // Availability: on-hold / incomplete profiles are not recommended as candidates.
  if (
    candidate.status === "ON_HOLD" ||
    candidate.status === "PROFILE_INCOMPLETE"
  ) {
    return false;
  }

  // Verification policy — never rewrite the domain or adapted verification flag.
  if (!includeUnverified && candidate.verification.status !== "VERIFIED") {
    return false;
  }

  // REJECTED profiles are never eligible even when includeUnverified is set.
  if (candidate.verification.status === "REJECTED") {
    return false;
  }

  if (!meetsRequiredPreferences(source, candidate)) {
    return false;
  }

  return true;
}

/**
 * Rank candidates without calling findMatches when unverified profiles
 * must remain in the pool. Uses the exported calculateMatchScore so
 * scoring rules stay in the engine; eligibility above is service-owned
 * so isVerified is never falsified.
 */
function rankWithFactualVerification(
  sourceProfile: MatchProfile,
  candidateProfiles: MatchProfile[],
  limit: number,
  minimumScore: number = DEFAULT_MATCH_OPTIONS.minimumScore,
): MatchResult[] {
  const scored: MatchResult[] = [];

  for (const candidate of candidateProfiles) {
    // Engine isEligible requires isVerified. For profiles that are factually
    // unverified we still score them here only after service eligibility
    // already allowed includeUnverified. Mirror remaining engine hard filters
    // (age/height/income bounds, opposite gender already checked).
    if (sourceProfile.id === candidate.id) continue;
    if (sourceProfile.gender === candidate.gender) continue;
    if (!candidate.isAvailable) continue;

    // Same UTC age helper as the engine so birthday boundaries agree.
    const candidateAge = calculateAgeUtc(candidate.dateOfBirth);
    const { minAge, maxAge, minHeightCm, maxHeightCm, minIncome, maxIncome } =
      sourceProfile.preferences;

    if (minAge !== undefined && candidateAge < minAge) continue;
    if (maxAge !== undefined && candidateAge > maxAge) continue;

    if (
      minHeightCm !== undefined &&
      candidate.heightCm !== undefined &&
      candidate.heightCm < minHeightCm
    ) {
      continue;
    }
    if (
      maxHeightCm !== undefined &&
      candidate.heightCm !== undefined &&
      candidate.heightCm > maxHeightCm
    ) {
      continue;
    }
    if (
      minIncome !== undefined &&
      candidate.annualIncome !== undefined &&
      candidate.annualIncome < minIncome
    ) {
      continue;
    }
    if (
      maxIncome !== undefined &&
      candidate.annualIncome !== undefined &&
      candidate.annualIncome > maxIncome
    ) {
      continue;
    }

    scored.push(calculateMatchScore(sourceProfile, candidate));
  }

  // Same minimumScore semantics as findMatches (DEFAULT_MATCH_OPTIONS.minimumScore).
  return scored
    .filter((result) => result.score >= minimumScore)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.candidate.id.localeCompare(right.candidate.id),
    )
    .slice(0, limit);
}

async function requireOwnedCustomer(
  customerId: string,
  matchmakerId: string,
): Promise<Customer> {
  const customer = await customerRepository.findById(customerId);

  // Ownership check: possession of an ID alone is never authorization.
  if (!customer || customer.assignedMatchmakerId !== matchmakerId) {
    throw new AppError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
  }

  return customer;
}

async function requireAccessibleMatch(
  matchId: string,
  matchmakerId: string,
): Promise<Match> {
  const match = await matchRepository.findById(matchId);

  if (!match) {
    throw new AppError("MATCH_NOT_FOUND", "Match not found", 404);
  }

  // Matchmaker who generated the suggestion is the authority of record.
  if (match.matchmakerId !== matchmakerId) {
    throw new AppError("MATCH_NOT_FOUND", "Match not found", 404);
  }

  return match;
}

export const matchService = {
  /**
   * Generate ranked match suggestions for an owned customer.
   */
  async generate(
    input: GenerateMatchesInput,
    matchmakerId: string,
  ): Promise<MatchSuggestion[]> {
    const source = await requireOwnedCustomer(input.customerId, matchmakerId);

    // Incomplete or paused sources must not drive new match generation.
    if (BLOCKED_SOURCE_STATUSES.has(source.status)) {
      throw new AppError(
        "SOURCE_NOT_READY",
        `Customer status ${source.status} cannot generate matches`,
        422,
      );
    }

    let sourceProfile: MatchProfile;
    try {
      sourceProfile = customerToMatchProfile(source);
    } catch (error) {
      if (error instanceof InsufficientProfileError) {
        throw new AppError(
          "INSUFFICIENT_PROFILE_DATA",
          error.message,
          422,
        );
      }
      throw error;
    }

    const allCustomers = await customerRepository.findAll();
    const existingMatches = await matchRepository.findByCustomerId(source.id);

    // Block pairs in either direction for any existing record.
    // Domain model has no "re-suggest after decline" flow, so all statuses count.
    const blockedCandidateIds = new Set<string>();
    for (const existing of existingMatches) {
      if (existing.customerId === source.id) {
        blockedCandidateIds.add(existing.candidateCustomerId);
      }
      if (existing.candidateCustomerId === source.id) {
        blockedCandidateIds.add(existing.customerId);
      }
    }

    const includeUnverified = input.includeUnverified === true;
    const candidateProfiles: MatchProfile[] = [];
    const candidateById = new Map<string, Customer>();

    for (const candidate of allCustomers) {
      if (blockedCandidateIds.has(candidate.id)) continue;

      if (!passesServiceEligibility(source, candidate, includeUnverified)) {
        continue;
      }

      const profile = tryCustomerToMatchProfile(candidate);
      if (!profile) continue;

      // isVerified stays factual. Never mutate it to bypass the engine.
      candidateProfiles.push(profile);
      candidateById.set(candidate.id, candidate);
    }

    const limit = input.limit ?? 10;

    // When the pool may contain factually unverified profiles, rank via
    // calculateMatchScore with service-level eligibility so verification
    // is never misrepresented. Otherwise reuse findMatches unchanged.
    const ranked = includeUnverified
      ? rankWithFactualVerification(sourceProfile, candidateProfiles, limit)
      : findMatches(sourceProfile, candidateProfiles, { limit });

    const suggestions: MatchSuggestion[] = [];
    const now = new Date().toISOString();
    const newMatchIds: string[] = [];

    for (const result of ranked) {
      const candidateCustomer = candidateById.get(result.candidate.id);
      if (!candidateCustomer) continue;

      const match: Match = {
        id: randomUUID(),
        customerId: source.id,
        candidateCustomerId: result.candidate.id,
        score: result.score,
        scoreBreakdown: toScoreBreakdown(result),
        explanation: toExplanation(result),
        status: "SUGGESTED",
        matchmakerId,
        createdAt: now,
        updatedAt: now,
      };

      await matchRepository.create(match);
      newMatchIds.push(match.id);

      suggestions.push({
        match,
        candidate: toCandidateCard(
          candidateCustomer,
          calculateAgeUtc(candidateCustomer.dateOfBirth),
        ),
      });
    }

    if (newMatchIds.length > 0) {
      // Re-read matchIds before write to reduce lost-update risk on the
      // convenience array (JsonStore serializes writes per file, but the
      // earlier read of source is outside that lock).
      const latest = await customerRepository.findById(source.id);
      const priorIds = latest?.matchIds ?? source.matchIds;
      const updatedMatchIds = [...priorIds, ...newMatchIds];

      const nextStatus =
        source.status === "READY_FOR_MATCHING" || source.status === "NEW"
          ? "MATCHES_SUGGESTED"
          : source.status;

      await customerRepository.update(source.id, {
        matchIds: updatedMatchIds,
        status: nextStatus,
        updatedAt: now,
      });
    }

    return suggestions;
  },

  /**
   * List persisted matches for an owned customer, enriched with candidate cards.
   */
  async listForCustomer(
    customerId: string,
    matchmakerId: string,
  ): Promise<MatchSuggestion[]> {
    await requireOwnedCustomer(customerId, matchmakerId);

    const matches = await matchRepository.findByCustomerId(customerId);

    const ownedAsSource = matches.filter(
      (match) =>
        match.customerId === customerId &&
        match.matchmakerId === matchmakerId,
    );

    const suggestions: MatchSuggestion[] = [];

    for (const match of ownedAsSource) {
      const candidate = await customerRepository.findById(
        match.candidateCustomerId,
      );

      // Candidate may belong to another matchmaker; the card fields are the
      // minimal set defined by MatchSuggestion and are required for ranking UI.
      if (!candidate) continue;

      suggestions.push({
        match,
        candidate: toCandidateCard(
          candidate,
          calculateAgeUtc(candidate.dateOfBirth),
        ),
      });
    }

    suggestions.sort((a, b) => b.match.score - a.match.score);

    return suggestions;
  },

  async getById(
    matchId: string,
    matchmakerId: string,
  ): Promise<MatchSuggestion> {
    const match = await requireAccessibleMatch(matchId, matchmakerId);

    const candidate = await customerRepository.findById(
      match.candidateCustomerId,
    );

    if (!candidate) {
      throw new AppError(
        "MATCH_NOT_FOUND",
        "Match candidate profile is no longer available",
        404,
      );
    }

    return {
      match,
      candidate: toCandidateCard(
        candidate,
        calculateAgeUtc(candidate.dateOfBirth),
      ),
    };
  },

  /**
   * Update match status. Cannot transition to SENT — use send() instead.
   */
  async updateStatus(
    matchId: string,
    nextStatus: MatchStatus,
    matchmakerId: string,
    feedback?: string,
  ): Promise<Match> {
    const match = await requireAccessibleMatch(matchId, matchmakerId);

    // SENT must go through the send endpoint so simulated delivery semantics apply.
    if (nextStatus === "SENT") {
      throw new AppError(
        "INVALID_STATUS_TRANSITION",
        "Use POST /api/matches/:matchId/send to mark a match as sent",
        400,
      );
    }

    const allowed = ALLOWED_TRANSITIONS[match.status] ?? [];

    if (!allowed.includes(nextStatus)) {
      throw new AppError(
        "INVALID_STATUS_TRANSITION",
        `Cannot transition match from ${match.status} to ${nextStatus}`,
        400,
      );
    }

    const now = new Date().toISOString();
    const updates: Partial<Match> = {
      status: nextStatus,
      updatedAt: now,
    };

    if (feedback !== undefined) {
      updates.feedback = feedback;
    }

    const updated = await matchRepository.update(matchId, updates);

    if (!updated) {
      throw new AppError(
        "PERSISTENCE_FAILURE",
        "Failed to update match status",
        500,
      );
    }

    return updated;
  },

  /**
   * Mock send-match. Only path that sets status SENT and sentAt.
   */
  async send(
    matchId: string,
    matchmakerId: string,
  ): Promise<SendMatchResult> {
    const match = await requireAccessibleMatch(matchId, matchmakerId);

    if (match.status !== "SUGGESTED" && match.status !== "SHORTLISTED") {
      throw new AppError(
        "INVALID_STATUS_TRANSITION",
        `Match in status ${match.status} cannot be sent`,
        400,
      );
    }

    const now = new Date().toISOString();

    const updated = await matchRepository.update(matchId, {
      status: "SENT",
      sentAt: now,
      updatedAt: now,
    });

    if (!updated) {
      throw new AppError(
        "PERSISTENCE_FAILURE",
        "Failed to persist send-match update",
        500,
      );
    }

    // Advance source workflow only from statuses that mean "no introduction yet".
    // Do not clobber AWAITING_FEEDBACK or later states when another match was sent.
    const source = await customerRepository.findById(match.customerId);
    if (
      source &&
      (source.status === "MATCHES_SUGGESTED" ||
        source.status === "READY_FOR_MATCHING")
    ) {
      await customerRepository.update(source.id, {
        status: "INTRODUCTION_SENT",
        updatedAt: now,
      });
    }

    return {
      matchId,
      status: "SENT",
      simulated: true,
      message:
        "Match introduction was simulated successfully. No email was delivered.",
      sentAt: now,
    };
  },
};
