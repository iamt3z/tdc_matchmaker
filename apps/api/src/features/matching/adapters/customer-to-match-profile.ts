import type { Customer, Gender as DomainGender, MaritalStatus as DomainMaritalStatus, TriState } from "@tdc/types";

import type {
  Gender as EngineGender,
  MaritalStatus as EngineMaritalStatus,
  MatchProfile,
  MatchPreferences,
  Preference,
} from "../match-types";

/**
 * Raised when a domain customer cannot be represented safely
 * by the matching engine without inventing compatibility data.
 */
export class InsufficientProfileError extends Error {
  constructor(
    public readonly code: "UNSUPPORTED_GENDER" | "MISSING_REQUIRED_FIELDS",
    message: string,
  ) {
    super(message);
    this.name = "InsufficientProfileError";
  }
}

/**
 * Map domain TriState values onto the engine Preference type.
 * The engine uses lowercase labels; missing values must not become
 * an implicit "yes" because that would inflate compatibility scores.
 */
function mapTriState(value: TriState | undefined): Preference {
  switch (value) {
    case "YES":
      return "yes";
    case "NO":
      return "no";
    case "MAYBE":
      return "maybe";
    default:
      // Unknown or absent answers are treated as uncertain, not compatible.
      return "maybe";
  }
}

/**
 * Engine gender is strictly binary. Domain "OTHER" cannot be scored
 * without inventing pairing rules the product has not defined.
 */
function mapGender(gender: DomainGender): EngineGender {
  if (gender === "MALE") return "male";
  if (gender === "FEMALE") return "female";

  throw new InsufficientProfileError(
    "UNSUPPORTED_GENDER",
    "Customers with gender OTHER cannot be processed by the current matching engine",
  );
}

/**
 * Domain marital statuses use NEVER_MARRIED; the engine expects "single".
 */
function mapMaritalStatus(status: DomainMaritalStatus): EngineMaritalStatus {
  switch (status) {
    case "NEVER_MARRIED":
      return "single";
    case "DIVORCED":
      return "divorced";
    case "WIDOWED":
      return "widowed";
    case "SEPARATED":
      return "separated";
    default:
      return "single";
  }
}

/**
 * Build engine preferences from the nested domain partnerPreferences object.
 *
 * Missing preference blocks stay undefined so the engine can apply neutral
 * scoring rather than treating absence as a hard match or hard reject.
 */
function mapPreferences(customer: Customer): MatchPreferences {
  const prefs = customer.partnerPreferences ?? {};

  const mapped: MatchPreferences = {};

  if (prefs.ageRange?.value) {
    mapped.minAge = prefs.ageRange.value.min;
    mapped.maxAge = prefs.ageRange.value.max;
  }

  if (prefs.height?.value) {
    mapped.minHeightCm = prefs.height.value.minCm;
    mapped.maxHeightCm = prefs.height.value.maxCm;
  }

  // Income bounds are not modelled as partner preferences in the domain type.
  // Directional income preference is applied separately for male customers.

  if (prefs.wantsChildren?.value !== undefined) {
    mapped.wantsKids = mapTriState(prefs.wantsChildren.value);
  }

  if (prefs.openToRelocation?.value !== undefined) {
    mapped.openToRelocation = mapTriState(prefs.openToRelocation.value);
  }

  if (prefs.openToPets?.value !== undefined) {
    mapped.openToPets = mapTriState(prefs.openToPets.value);
  }

  if (prefs.languages?.value?.length) {
    mapped.preferredLanguages = prefs.languages.value;
  }

  if (prefs.professions?.value?.length) {
    mapped.preferredProfessions = prefs.professions.value;
  }

  if (prefs.familyValues?.value?.length) {
    mapped.preferredValues = prefs.familyValues.value;
  }

  // Assignment rule: for male customers, prioritise younger, lower-earning,
  // and shorter female candidates. These flags drive the engine's directional
  // scoring paths without hard-coding gender assumptions inside the engine.
  if (customer.gender === "MALE") {
    mapped.preferYoungerCandidate = true;
    mapped.preferLowerIncomeCandidate = true;
    mapped.preferShorterCandidate = true;
  }

  return mapped;
}

/**
 * Convert a domain Customer into the matching engine's MatchProfile.
 *
 * Throws InsufficientProfileError when the profile is fundamentally unscorable
 * (e.g. unsupported gender). Callers that need a soft failure should use
 * tryCustomerToMatchProfile instead.
 */
export function customerToMatchProfile(customer: Customer): MatchProfile {
  const gender = mapGender(customer.gender);

  // Verification and availability gate eligibility inside the engine.
  // UNVERIFIED / REJECTED profiles must not be recommended as candidates.
  const isVerified = customer.verification.status === "VERIFIED";

  // Profiles on hold or incomplete should not receive new recommendations
  // as candidates; the source customer may still request matches.
  const isAvailable =
    customer.status !== "ON_HOLD" &&
    customer.status !== "PROFILE_INCOMPLETE";

  const annualIncome = customer.employment?.annualIncome?.amount;

  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    gender,
    dateOfBirth: customer.dateOfBirth,
    country: customer.location.country,
    city: customer.location.city,
    heightCm: customer.heightCm,
    annualIncome,
    college: customer.education?.undergraduateCollege,
    degree:
      customer.education?.degree ??
      customer.education?.highestQualification,
    profession: customer.employment?.designation,
    company: customer.employment?.currentCompany,
    maritalStatus: mapMaritalStatus(customer.maritalStatus),
    languages: customer.languagesKnown ?? [],
    wantsKids: mapTriState(customer.wantsChildren),
    openToRelocation: mapTriState(customer.openToRelocation),
    openToPets: mapTriState(customer.openToPets),
    // Relationship goal is not present on the domain model; leave undefined
    // so the engine scores that factor neutrally.
    relationshipGoal: undefined,
    values: customer.family?.familyValues ?? [],
    interests: customer.lifestyle?.hobbies ?? [],
    isVerified,
    isAvailable,
    preferences: mapPreferences(customer),
  };
}

/**
 * Safely attempt adaptation. Returns undefined instead of throwing when
 * the customer cannot participate in matching (e.g. gender OTHER).
 * Used when bulk-mapping candidate pools so one bad profile does not
 * abort the entire generation request.
 */
export function tryCustomerToMatchProfile(
  customer: Customer,
): MatchProfile | undefined {
  try {
    return customerToMatchProfile(customer);
  } catch (error) {
    if (error instanceof InsufficientProfileError) {
      return undefined;
    }
    throw error;
  }
}
