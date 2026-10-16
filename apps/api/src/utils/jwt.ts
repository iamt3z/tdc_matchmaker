import jwt from "jsonwebtoken";
import type { AuthenticatedMatchmaker } from "@tdc/types";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string;
  username: string;
}

/**
 * Signs a short-lived access token.
 * Only non-sensitive identity claims belong in the token.
 */
export function signAccessToken(
  user: AuthenticatedMatchmaker,
): string {
  return jwt.sign(
    {
      username: user.username,
    },
    env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      issuer: "tdc-matchmaker-api",
      audience: "tdc-matchmaker-web",
    },
  );
}

/**
 * Verifies signature, expiry, issuer and intended audience.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    issuer: "tdc-matchmaker-api",
    audience: "tdc-matchmaker-web",
    algorithms: ["HS256"],
  });

  if (
    typeof decoded === "string" ||
    typeof decoded.sub !== "string" ||
    typeof decoded.username !== "string"
  ) {
    throw new Error("Invalid access token payload");
  }

  return {
    sub: decoded.sub,
    username: decoded.username,
  };
}