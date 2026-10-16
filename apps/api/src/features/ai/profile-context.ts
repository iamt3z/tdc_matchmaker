import type { Customer, Match } from "@tdc/types";
import { calculateAgeUtc } from "../../utils/age";

/**
 * Minimal, non-sensitive profile snapshot for LLM prompts.
 *
 * Explicitly excludes: email, phone, notes, matchmaker internals,
 * authentication data, and free-text that could inject instructions
 * beyond a short introduction excerpt.
 *
 * Profile field values are treated as untrusted factual context only —
 * never as instructions to the model.
 */
export interface SafeProfileContext {
  firstName: string;
  age: number;
  gender: string;
  city: string;
  country: string;
  heightCm?: number;
  maritalStatus: string;
  degree?: string;
  designation?: string;
  industry?: string;
  languages: string[];
  religion?: string;
  casteOrCommunity?: string;
  wantsChildren: string;
  openToRelocation: string;
  openToPets: string;
  familyValues?: string[];
  hobbies?: string[];
  /** Truncated introduction; not full free-text dump. */
  introductionExcerpt?: string;
  verificationStatus: string;
}

export function toSafeProfileContext(customer: Customer): SafeProfileContext {
  const intro = customer.introduction?.trim();
  return {
    firstName: customer.firstName,
    age: calculateAgeUtc(customer.dateOfBirth),
    gender: customer.gender,
    city: customer.location.city,
    country: customer.location.country,
    heightCm: customer.heightCm,
    maritalStatus: customer.maritalStatus,
    degree:
      customer.education?.degree ??
      customer.education?.highestQualification,
    designation: customer.employment?.designation,
    industry: customer.employment?.industry,
    languages: customer.languagesKnown ?? [],
    religion: customer.religion,
    casteOrCommunity: customer.casteOrCommunity,
    wantsChildren: customer.wantsChildren,
    openToRelocation: customer.openToRelocation,
    openToPets: customer.openToPets,
    familyValues: customer.family?.familyValues,
    hobbies: customer.lifestyle?.hobbies,
    introductionExcerpt:
      intro && intro.length > 0
        ? intro.slice(0, 280)
        : undefined,
    verificationStatus: customer.verification.status,
  };
}

export interface SafeMatchContext {
  score: number;
  status: string;
  /** Rule-based summary already produced by the deterministic engine. */
  rulesSummary: string;
  strengths: string[];
  considerations: string[];
}

export function toSafeMatchContext(match: Match): SafeMatchContext {
  return {
    score: match.score,
    status: match.status,
    rulesSummary: match.explanation.summary,
    strengths: match.explanation.strengths.slice(0, 6),
    considerations: match.explanation.considerations.slice(0, 6),
  };
}
