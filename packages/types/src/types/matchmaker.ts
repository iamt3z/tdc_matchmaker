import type { ISODateTime } from "./common";

/**
 * Account status controls whether a matchmaker can access the system.
 */
export type MatchmakerStatus = "ACTIVE" | "DISABLED";

/**
 * Represents an internal matchmaker account.
 *
 * Never return passwordHash to the frontend.
 */
export interface Matchmaker {
  id: string;
  username: string;
  displayName: string;

  /**
   * Stores a password hash, never a plaintext password.
   */
  passwordHash: string;

  status: MatchmakerStatus;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/**
 * Credentials submitted during login.
 */
export interface LoginInput {
  username: string;
  password: string;
}

/**
 * Safe public representation of the authenticated matchmaker.
 */
export interface AuthenticatedMatchmaker {
  id: string;
  username: string;
  displayName: string;
}

/**
 * Response returned after successful authentication.
 *
 * The actual token or session strategy is an implementation decision.
 */
export interface LoginResponse {
  user: AuthenticatedMatchmaker;
  accessToken?: string;
}