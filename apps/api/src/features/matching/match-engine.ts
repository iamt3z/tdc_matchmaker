
import type {
  MatchOptions,
  MatchProfile,
  MatchReason,
  MatchResult,
  Preference,
} from "./match-types";

import {
  DEFAULT_MATCH_OPTIONS,
  MATCH_WEIGHTS,
  TOTAL_MATCH_WEIGHT,
} from "./match-config";
import { calculateAgeUtc } from "../../utils/age";

/**
 * Age for eligibility and scoring.
 * Delegates to the shared UTC helper so service-level filters and the
 * engine never disagree around birthday boundaries.
 */
function getAge(dateOfBirth: string): number {
  return calculateAgeUtc(dateOfBirth);
}

/**
 * Normalize strings for case-insensitive comparisons.
 */
function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

/**
 * Calculate overlap between two lists.
 * Both lists are normalized to avoid casing differences.
 */
function getOverlap(left: string[], right: string[]): string[] {
  const rightValues = new Set(right.map(normalize));

  return [...new Set(left.map(normalize))].filter((value) =>
    rightValues.has(value),
  );
}

/**
 * Add a factor to the score breakdown.
 */
function createReason(
  factor: string,
  score: number,
  maxScore: number,
  explanation: string,
): MatchReason {
  return {
    factor,
    score: Math.round(score * 100) / 100,
    maxScore,
    explanation,
  };
}

/**
 * Check whether two people's stated preferences are compatible.
 *
 * "Maybe" represents uncertainty, not an automatic rejection.
 * The compatibility score reflects how clearly the answers align.
 */
function scorePreference(
  left: Preference,
  right: Preference,
): number {
  if (left === "maybe" || right === "maybe") {
    return left === right ? 0.75 : 0.5;
  }

  return left === right ? 1 : 0;
}

/**
 * Reject candidates who cannot be recommended.
 *
 * This stage handles eligibility, not ranking.
 * Do not use a low compatibility score as a substitute for eligibility.
 */
function isEligible(
  customer: MatchProfile,
  candidate: MatchProfile,
): boolean {
  if (customer.id === candidate.id) return false;

  if (customer.gender === candidate.gender) return false;

  if (!candidate.isVerified || !candidate.isAvailable) {
    return false;
  }

  // Do not recommend a profile outside the customer's stated age range.
  const candidateAge = getAge(candidate.dateOfBirth);
  const { minAge, maxAge } = customer.preferences;

  if (minAge !== undefined && candidateAge < minAge) {
    return false;
  }

  if (maxAge !== undefined && candidateAge > maxAge) {
    return false;
  }

  // Height and income constraints are hard filters only when
  // explicitly provided by the customer.
  const candidateHeight = candidate.heightCm;
  const candidateIncome = candidate.annualIncome;

  if (
    customer.preferences.minHeightCm !== undefined &&
    candidateHeight !== undefined &&
    candidateHeight < customer.preferences.minHeightCm
  ) {
    return false;
  }

  if (
    customer.preferences.maxHeightCm !== undefined &&
    candidateHeight !== undefined &&
    candidateHeight > customer.preferences.maxHeightCm
  ) {
    return false;
  }

  if (
    customer.preferences.minIncome !== undefined &&
    candidateIncome !== undefined &&
    candidateIncome < customer.preferences.minIncome
  ) {
    return false;
  }

  if (
    customer.preferences.maxIncome !== undefined &&
    candidateIncome !== undefined &&
    candidateIncome > customer.preferences.maxIncome
  ) {
    return false;
  }

  return true;
}

/**
 * Score age compatibility.
 *
 * The male-customer assignment rule is directional:
 * prefer younger women, where that rule is enabled.
 *
 * For other cases, age is evaluated against the stated preferences.
 */
function scoreAge(
  customer: MatchProfile,
  candidate: MatchProfile,
): MatchReason {
  const weight = MATCH_WEIGHTS.age;

  const customerAge = getAge(customer.dateOfBirth);
  const candidateAge = getAge(candidate.dateOfBirth);

  if (customer.preferences.preferYoungerCandidate) {
    const isYounger = candidateAge < customerAge;

    return createReason(
      "Age",
      isYounger ? weight : 0,
      weight,
      isYounger
        ? "The candidate is younger, matching the configured preference."
        : "The candidate is not younger than the customer.",
    );
  }

  const { minAge, maxAge } = customer.preferences;

  if (minAge === undefined && maxAge === undefined) {
    return createReason(
      "Age",
      weight / 2,
      weight,
      "Age preferences are unspecified; this factor is neutral.",
    );
  }

  const fitsMinimum = minAge === undefined || candidateAge >= minAge;
  const fitsMaximum = maxAge === undefined || candidateAge <= maxAge;

  const fits = fitsMinimum && fitsMaximum;

  return createReason(
    "Age",
    fits ? weight : 0,
    weight,
    fits
      ? "The candidate fits the stated age preferences."
      : "The candidate does not fit the stated age preferences.",
  );
}

/**
 * Score height compatibility.
 */
function scoreHeight(
  customer: MatchProfile,
  candidate: MatchProfile,
): MatchReason {
  const weight = MATCH_WEIGHTS.height;
  const preferredHeight = customer.preferences.preferShorterCandidate;

  if (preferredHeight) {
    if (candidate.heightCm === undefined || customer.heightCm === undefined) {
      return createReason(
        "Height",
        weight / 2,
        weight,
        "Height data is incomplete; compatibility is uncertain.",
      );
    }

    const fits = candidate.heightCm < customer.heightCm;

    return createReason(
      "Height",
      fits ? weight : 0,
      weight,
      fits
        ? "The candidate is shorter, matching the configured preference."
        : "The candidate is not shorter than the customer.",
    );
  }

  const { minHeightCm, maxHeightCm } = customer.preferences;

  if (minHeightCm === undefined && maxHeightCm === undefined) {
    return createReason(
      "Height",
      weight / 2,
      weight,
      "No height preference was specified.",
    );
  }

  if (candidate.heightCm === undefined) {
    return createReason(
      "Height",
      weight / 2,
      weight,
      "Candidate height is unavailable.",
    );
  }

  const fits =
    (minHeightCm === undefined ||
      candidate.heightCm >= minHeightCm) &&
    (maxHeightCm === undefined ||
      candidate.heightCm <= maxHeightCm);

  return createReason(
    "Height",
    fits ? weight : 0,
    weight,
    fits
      ? "The candidate fits the stated height preferences."
      : "The candidate falls outside the stated height preferences.",
  );
}

/**
 * Score income compatibility.
 *
 * Lower income is only preferred when the relevant rule is enabled.
 * Otherwise, use explicit income boundaries or a neutral score.
 */
function scoreIncome(
  customer: MatchProfile,
  candidate: MatchProfile,
): MatchReason {
  const weight = MATCH_WEIGHTS.income;

  if (customer.preferences.preferLowerIncomeCandidate) {
    if (
      customer.annualIncome === undefined ||
      candidate.annualIncome === undefined
    ) {
      return createReason(
        "Income",
        weight / 2,
        weight,
        "Income data is incomplete; compatibility is uncertain.",
      );
    }

    const fits = candidate.annualIncome < customer.annualIncome;

    return createReason(
      "Income",
      fits ? weight : 0,
      weight,
      fits
        ? "The candidate earns less, matching the configured rule."
        : "The candidate does not earn less than the customer.",
    );
  }

  const { minIncome, maxIncome } = customer.preferences;

  if (minIncome === undefined && maxIncome === undefined) {
    return createReason(
      "Income",
      weight / 2,
      weight,
      "No income preference was specified.",
    );
  }

  if (candidate.annualIncome === undefined) {
    return createReason(
      "Income",
      weight / 2,
      weight,
      "Candidate income is unavailable.",
    );
  }

  const fits =
    (minIncome === undefined || candidate.annualIncome >= minIncome) &&
    (maxIncome === undefined || candidate.annualIncome <= maxIncome);

  return createReason(
    "Income",
    fits ? weight : 0,
    weight,
    fits
      ? "The candidate fits the stated income preferences."
      : "The candidate falls outside the stated income preferences.",
  );
}

/**
 * Compare children, relocation and pet preferences.
 */
function scoreSharedPreference(
  factor: "Children" | "Relocation" | "Pets",
  customerValue: Preference,
  candidateValue: Preference,
  weight: number,
): MatchReason {
  const compatibility = scorePreference(customerValue, candidateValue);
  const score = compatibility * weight;

  return createReason(
    factor,
    score,
    weight,
    compatibility === 1
      ? `Both profiles have compatible ${factor.toLowerCase()} preferences.`
      : compatibility >= 0.75
        ? `Both profiles selected "maybe" for ${factor.toLowerCase()}.`
        : `The ${factor.toLowerCase()} preferences need further discussion.`,
  );
}

/**
 * Compare profession, relationship goals, languages and values.
 */
function scoreListPreference(
  factor: string,
  preferred: string[] | undefined,
  candidateValues: string[],
  weight: number,
): MatchReason {
  if (!preferred || preferred.length === 0) {
    return createReason(
      factor,
      weight / 2,
      weight,
      `No ${factor.toLowerCase()} preference was specified.`,
    );
  }

  const matches = getOverlap(preferred, candidateValues);
  const ratio = matches.length / new Set(preferred.map(normalize)).size;

  return createReason(
    factor,
    ratio * weight,
    weight,
    matches.length > 0
      ? `Shared ${factor.toLowerCase()}: ${matches.join(", ")}.`
      : `No direct ${factor.toLowerCase()} preference match was found.`,
  );
}

/**
 * Calculate a transparent match score.
 *
 * The score is a compatibility heuristic, not a probability of
 * relationship success.
 */
export function calculateMatchScore(
  customer: MatchProfile,
  candidate: MatchProfile,
): MatchResult {
  const reasons: MatchReason[] = [
    scoreAge(customer, candidate),
    scoreHeight(customer, candidate),
    scoreIncome(customer, candidate),

    scoreSharedPreference(
      "Children",
      customer.wantsKids,
      candidate.wantsKids,
      MATCH_WEIGHTS.children,
    ),

    scoreSharedPreference(
      "Relocation",
      customer.openToRelocation,
      candidate.openToRelocation,
      MATCH_WEIGHTS.relocation,
    ),

    scoreListPreference(
      "Profession",
      customer.preferences.preferredProfessions,
      candidate.profession ? [candidate.profession] : [],
      MATCH_WEIGHTS.profession,
    ),

    scoreListPreference(
      "Relationship goal",
      customer.preferences.relationshipGoal
        ? [customer.preferences.relationshipGoal]
        : undefined,
      candidate.relationshipGoal ? [candidate.relationshipGoal] : [],
      MATCH_WEIGHTS.relationshipGoal,
    ),

    scoreListPreference(
      "Languages",
      customer.preferences.preferredLanguages,
      candidate.languages,
      MATCH_WEIGHTS.languages,
    ),

    scoreListPreference(
      "Values",
      customer.preferences.preferredValues,
      candidate.values,
      MATCH_WEIGHTS.values,
    ),

    scoreSharedPreference(
      "Pets",
      customer.openToPets,
      candidate.openToPets,
      MATCH_WEIGHTS.pets,
    ),
  ];

  const rawScore = reasons.reduce(
    (total, reason) => total + reason.score,
    0,
  );

  const matchedPreferences = reasons
    .filter((reason) => reason.score >= reason.maxScore * 0.75)
    .map((reason) => reason.factor);

  const potentialDifferences = reasons
    .filter((reason) => reason.score < reason.maxScore * 0.5)
    .map((reason) => reason.explanation);

  return {
    candidate,
    score: Math.round((rawScore / TOTAL_MATCH_WEIGHT) * 100),
    reasons,
    matchedPreferences,
    potentialDifferences,
  };
}

/**
 * Produce the ranked list of eligible candidates.
 */
export function findMatches(
  customer: MatchProfile,
  candidates: MatchProfile[],
  options: MatchOptions = {},
): MatchResult[] {
  const limit = options.limit ?? DEFAULT_MATCH_OPTIONS.limit;
  const minimumScore =
    options.minimumScore ?? DEFAULT_MATCH_OPTIONS.minimumScore;

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Match limit must be a positive integer.");
  }

  if (minimumScore < 0 || minimumScore > 100) {
    throw new Error("Minimum score must be between 0 and 100.");
  }

  return candidates
    .filter((candidate) => isEligible(customer, candidate))
    .map((candidate) => calculateMatchScore(customer, candidate))
    .filter((result) => result.score >= minimumScore)
    // Stable tie-breaking makes the results reproducible.
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.candidate.id.localeCompare(right.candidate.id),
    )
    .slice(0, limit);
}
