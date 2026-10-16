/**
 * Frontend types aligned with @tdc/types / API envelopes.
 * Kept local so the web app can type responses without depending on
 * workspace package resolution at build time.
 */

export type TriState = "YES" | "NO" | "MAYBE";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type MaritalStatus =
  | "NEVER_MARRIED"
  | "DIVORCED"
  | "WIDOWED"
  | "SEPARATED";

export type CustomerStatus =
  | "NEW"
  | "PROFILE_INCOMPLETE"
  | "READY_FOR_MATCHING"
  | "MATCHES_SUGGESTED"
  | "INTRODUCTION_SENT"
  | "AWAITING_FEEDBACK"
  | "ON_HOLD";

export type VerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export type MatchStatus =
  | "SUGGESTED"
  | "SHORTLISTED"
  | "SENT"
  | "ACCEPTED"
  | "DECLINED"
  | "WITHDRAWN";

export type NoteType = "CALL" | "MEETING" | "EMAIL" | "OTHER";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface AuthenticatedMatchmaker {
  id: string;
  username: string;
  displayName: string;
}

export interface LoginResponse {
  user: AuthenticatedMatchmaker;
  accessToken?: string;
}

export interface CustomerListItem {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  city: string;
  maritalStatus: MaritalStatus;
  status: CustomerStatus;
  verificationStatus: VerificationStatus;
}

export interface CustomerListResult {
  items: CustomerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Location {
  country: string;
  city: string;
  stateOrRegion?: string;
}

export interface Customer {
  id: string;
  assignedMatchmakerId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  heightCm?: number;
  maritalStatus: MaritalStatus;
  email: string;
  phoneNumber: string;
  location: Location;
  education: {
    undergraduateCollege?: string;
    degree?: string;
    highestQualification?: string;
    fieldOfStudy?: string;
  };
  employment: {
    currentCompany?: string;
    designation?: string;
    industry?: string;
    annualIncome?: { amount: number; currency: string };
  };
  languagesKnown: string[];
  preferredRelationshipLanguage?: string;
  religion?: string;
  casteOrCommunity?: string;
  family: {
    numberOfSiblings?: number;
    familyValues?: string[];
    familyIntroduction?: string;
  };
  wantsChildren: TriState;
  openToRelocation: TriState;
  openToPets: TriState;
  lifestyle?: {
    dietaryPreferences?: string[];
    hobbies?: string[];
    horoscopePreference?: string;
  };
  partnerPreferences: Record<string, unknown>;
  introduction?: string;
  status: CustomerStatus;
  verification: { status: VerificationStatus };
  matchIds: string[];
  noteIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchScoreBreakdown {
  mutualPreferences: number;
  familyExpectations: number;
  lifestyle: number;
  careerAndEducation: number;
  locationAndRelocation: number;
  language: number;
}

export interface MatchExplanation {
  summary: string;
  strengths: string[];
  considerations: string[];
  generatedBy: "RULES" | "LLM";
}

export interface Match {
  id: string;
  customerId: string;
  candidateCustomerId: string;
  score: number;
  scoreBreakdown: MatchScoreBreakdown;
  explanation: MatchExplanation;
  status: MatchStatus;
  matchmakerId: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  feedback?: string;
}

export interface MatchSuggestion {
  match: Match;
  candidate: {
    id: string;
    firstName: string;
    age: number;
    city: string;
    heightCm?: number;
    degree?: string;
    designation?: string;
    introduction?: string;
  };
}

export interface SendMatchResult {
  matchId: string;
  status: "SENT";
  simulated: true;
  message: string;
  sentAt: string;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  matchmakerId: string;
  type: NoteType;
  subject: string;
  content: string;
  followUpAt?: string;
  followUpAction?: string;
  followUpCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  type: NoteType;
  subject: string;
  content: string;
  followUpAt?: string;
  followUpAction?: string;
}
