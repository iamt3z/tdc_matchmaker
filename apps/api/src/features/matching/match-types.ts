
/**
 * Core domain types for the TDC Match Engine.
 * Keep these independent of database and AI-provider types.
 */

export type Gender = "male" | "female";

export type Preference = "yes" | "no" | "maybe";

export type MaritalStatus =
  | "single"
  | "divorced"
  | "widowed"
  | "separated";

export type RelationshipGoal =
  | "marriage"
  | "long_term"
  | "exploring";

export interface MatchPreferences {
  /** Inclusive age boundaries. */
  minAge?: number;
  maxAge?: number;

  /** Height boundaries in centimeters. */
  minHeightCm?: number;
  maxHeightCm?: number;

  /** Annual income boundaries in a consistent currency. */
  minIncome?: number;
  maxIncome?: number;

  /** Optional explicit lifestyle and relationship preferences. */
  wantsKids?: Preference;
  openToRelocation?: Preference;
  openToPets?: Preference;

  /** Shared interests and expectations. */
  preferredLanguages?: string[];
  preferredProfessions?: string[];
  relationshipGoal?: RelationshipGoal;
  preferredValues?: string[];

  /**
   * Assignment-specific directional rules.
   * These are configurable rather than universal assumptions.
   */
  preferYoungerCandidate?: boolean;
  preferLowerIncomeCandidate?: boolean;
  preferShorterCandidate?: boolean;
}

export interface MatchProfile {
  id: string;
  firstName: string;
  lastName: string;

  gender: Gender;
  dateOfBirth: string;
  country: string;
  city: string;

  heightCm?: number;
  annualIncome?: number;

  college?: string;
  degree?: string;
  profession?: string;
  company?: string;

  maritalStatus: MaritalStatus;
  languages: string[];

  wantsKids: Preference;
  openToRelocation: Preference;
  openToPets: Preference;

  relationshipGoal?: RelationshipGoal;
  values: string[];
  interests: string[];

  /** Profiles must be verified and available before recommendation. */
  isVerified: boolean;
  isAvailable: boolean;

  preferences: MatchPreferences;
}

export interface MatchReason {
  factor: string;
  score: number;
  maxScore: number;
  explanation: string;
}

export interface MatchResult {
  candidate: MatchProfile;
  score: number;
  reasons: MatchReason[];
  matchedPreferences: string[];
  potentialDifferences: string[];
}

export interface MatchOptions {
  limit?: number;
  minimumScore?: number;
}
