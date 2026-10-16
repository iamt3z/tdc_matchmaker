import type {
  CustomerStatus,
  Gender,
  Location,
  MaritalStatus,
  Money,
  PreferenceImportance,
  TriState,
  ISODate,
  ISODateTime,
  VerificationStatus,
} from "./common";

/**
 * A partner preference combines a desired value with its importance.
 *
 * Example:
 * {
 *   value: "Lagos",
 *   importance: "PREFERRED"
 * }
 *
 * REQUIRED preferences may exclude candidates when incompatible.
 * PREFERRED preferences influence the score.
 * FLEXIBLE preferences should have limited influence.
 */
export interface PartnerPreference<T> {
  value: T;
  importance: PreferenceImportance;
}

/**
 * Represents a desired partner age range.
 */
export interface AgeRange {
  min: number;
  max: number;
}

/**
 * Represents a preferred partner height range in centimetres.
 */
export interface HeightPreference {
  minCm?: number;
  maxCm?: number;
}

/**
 * Contains the customer's desired partner characteristics.
 *
 * Keep preferences separate from the customer's own biodata.
 * For example, religion is the customer's attribute, while
 * preferred religion is a partner preference.
 */
export interface CustomerPreferences {
  ageRange?: PartnerPreference<AgeRange>;

  locations?: PartnerPreference<Location[]>;

  height?: PartnerPreference<HeightPreference>;

  maritalStatuses?: PartnerPreference<MaritalStatus[]>;

  educationLevels?: PartnerPreference<string[]>;

  professions?: PartnerPreference<string[]>;

  languages?: PartnerPreference<string[]>;

  religion?: PartnerPreference<string>;

  casteOrCommunity?: PartnerPreference<string>;

  wantsChildren?: PartnerPreference<TriState>;

  openToRelocation?: PartnerPreference<TriState>;

  openToPets?: PartnerPreference<TriState>;

  dietaryPreferences?: PartnerPreference<string[]>;

  familyValues?: PartnerPreference<string[]>;

  /**
   * Additional preferences can be introduced without changing
   * the entire customer model for every new requirement.
   */
  additionalPreferences?: Array<{
    key: string;
    label: string;
    value: string | string[] | number | boolean;
    importance: PreferenceImportance;
  }>;
}

/**
 * Educational background of a customer.
 */
export interface CustomerEducation {
  undergraduateCollege?: string;
  degree?: string;
  highestQualification?: string;
  fieldOfStudy?: string;
}

/**
 * Employment and income details.
 */
export interface CustomerEmployment {
  currentCompany?: string;
  designation?: string;
  industry?: string;
  annualIncome?: Money;
}

/**
 * Family information relevant to matrimonial matchmaking.
 */
export interface CustomerFamily {
  numberOfSiblings?: number;
  familyValues?: string[];
  familyIntroduction?: string;
}

/**
 * Optional lifestyle information.
 */
export interface CustomerLifestyle {
  dietaryPreferences?: string[];
  hobbies?: string[];
  horoscopePreference?: "REQUIRED" | "PREFERRED" | "NOT_REQUIRED";
}

/**
 * Verification metadata.
 *
 * Verification status should only be changed by an authorized workflow.
 */
export interface CustomerVerification {
  status: VerificationStatus;
  lastReviewedAt?: ISODateTime;
  reviewedBy?: string;
}

/**
 * The complete customer record.
 *
 * `id` is a stable application identifier. It can later map to a
 * PostgreSQL primary key when the persistence layer changes to Prisma.
 */
export interface Customer {
  id: string;

  /**
   * The matchmaker responsible for this customer.
   */
  assignedMatchmakerId: string;

  // Basic biodata
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: ISODate;
  heightCm?: number;
  maritalStatus: MaritalStatus;

  // Contact information
  email: string;
  phoneNumber: string;

  // Location
  location: Location;

  // Education and career
  education: CustomerEducation;
  employment: CustomerEmployment;

  // Cultural and family details
  languagesKnown: string[];
  preferredRelationshipLanguage?: string;
  religion?: string;
  casteOrCommunity?: string;
  family: CustomerFamily;

  // Personal preferences and values
  wantsChildren: TriState;
  openToRelocation: TriState;
  openToPets: TriState;

  lifestyle?: CustomerLifestyle;

  /**
   * The customer's desired partner characteristics.
   */
  partnerPreferences: CustomerPreferences;

  /**
   * Optional self-written profile description.
   */
  introduction?: string;

  // Matchmaking workflow
  status: CustomerStatus;
  verification: CustomerVerification;

  /**
   * Convenience references for the JSON implementation.
   *
   * In a future relational database, matches and notes should use
   * foreign keys and join tables rather than relying on these arrays
   * as the authoritative relationships.
   */
  matchIds: string[];
  noteIds: string[];

  // Audit timestamps
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/**
 * Payload for creating a customer.
 *
 * The server generates IDs, assigns a matchmaker, establishes the
 * initial status, and creates timestamps.
 */
export type CreateCustomerInput = Omit<
  Customer,
  | "id"
  | "assignedMatchmakerId"
  | "status"
  | "verification"
  | "matchIds"
  | "noteIds"
  | "createdAt"
  | "updatedAt"
>;

/**
 * A partial update allows the client to change only supplied fields.
 * The service layer must still validate fields and enforce permissions.
 */
export type UpdateCustomerInput = Partial<CreateCustomerInput>;

/**
 * Lightweight customer data for dashboard tables.
 *
 * Do not send the full customer record when a list only needs
 * basic profile and matchmaking status information.
 */
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