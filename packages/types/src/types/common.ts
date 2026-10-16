/**
 * Represents a yes/no/maybe answer.
 * Used for preferences where a strict boolean would be insufficient.
 */
export type TriState = "YES" | "NO" | "MAYBE";

/**
 * Gender options used by the matchmaking system.
 * The matching algorithm must explicitly handle unsupported or unknown
 * matching configurations rather than silently assuming compatibility.
 */
export type Gender = "MALE" | "FEMALE" | "OTHER";

/**
 * Marital status options for a customer.
 */
export type MaritalStatus =
  | "NEVER_MARRIED"
  | "DIVORCED"
  | "WIDOWED"
  | "SEPARATED";

/**
 * Represents the customer's position in the matchmaking journey.
 */
export type CustomerStatus =
  | "NEW"
  | "PROFILE_INCOMPLETE"
  | "READY_FOR_MATCHING"
  | "MATCHES_SUGGESTED"
  | "INTRODUCTION_SENT"
  | "AWAITING_FEEDBACK"
  | "ON_HOLD";

/**
 * Tracks whether a customer profile has been verified.
 */
export type VerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

/**
 * Indicates how strongly a customer values a partner preference.
 */
export type PreferenceImportance =
  | "REQUIRED"
  | "PREFERRED"
  | "FLEXIBLE";

/**
 * Represents a country and city, with an optional state or region.
 */
export interface Location {
  country: string;
  city: string;
  stateOrRegion?: string;
}

/**
 * Represents a monetary value.
 * Currency is an ISO-style three-letter currency code, such as INR or NGN.
 */
export interface Money {
  amount: number;
  currency: string;
}

/**
 * Date-only values use YYYY-MM-DD strings.
 * Timestamps use ISO 8601 strings, normally in UTC.
 */
export type ISODate = string;
export type ISODateTime = string;

/**
 * Standard successful API response.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/**
 * Standard error response.
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Every endpoint returns either a success or error envelope.
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;