import bcrypt from "bcryptjs";
import type {
  AuthenticatedMatchmaker,
  LoginResponse,
} from "@tdc/types";

import { matchmakerRepository } from "../repositories/matchmaker.repository";
import { signAccessToken } from "../utils/jwt";

export class AuthenticationError extends Error {
  constructor(
    public readonly code:
      | "INVALID_CREDENTIALS"
      | "ACCOUNT_DISABLED",
    message: string,
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export const authService = {
  /**
   * Authenticates the matchmaker and returns a safe public user object.
   */
  async login(
    username: string,
    password: string,
  ): Promise<LoginResponse> {
    const matchmaker =
      await matchmakerRepository.findByUsername(username);

    // Use the same public error for unknown usernames and wrong passwords.
    if (
      !matchmaker ||
      !(await bcrypt.compare(password, matchmaker.passwordHash))
    ) {
      throw new AuthenticationError(
        "INVALID_CREDENTIALS",
        "Invalid username or password",
      );
    }

    if (matchmaker.status !== "ACTIVE") {
      throw new AuthenticationError(
        "ACCOUNT_DISABLED",
        "This account is disabled",
      );
    }

    const user: AuthenticatedMatchmaker = {
      id: matchmaker.id,
      username: matchmaker.username,
      displayName: matchmaker.displayName,
    };

    return {
      user,
      accessToken: signAccessToken(user),
    };
  },
};