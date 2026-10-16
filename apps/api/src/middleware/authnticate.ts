import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

/**
 * Attaches verified identity claims to the request.
 */
export interface AuthenticatedRequest extends Request {
  auth?: {
    matchmakerId: string;
    username: string;
  };
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authorization = req.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required",
      },
    });
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required",
      },
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    req.auth = {
      matchmakerId: payload.sub,
      username: payload.username,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "The access token is invalid or expired",
      },
    });
  }
}