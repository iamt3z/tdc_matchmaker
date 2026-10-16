import type { NextFunction, Request, Response } from "express";

/**
 * Application-level error with a stable machine-readable code.
 * Services throw these so the global handler can map them to HTTP status codes
 * without leaking internal details.
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Global Express error middleware.
 *
 * Keeps the project's established envelope:
 * { success: false, error: { code, message, details? } }
 *
 * Stack traces and sensitive data must never reach the client.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
    return;
  }

  // Unexpected failures — log server-side only, return a generic response.
  console.error("Unhandled API error:", error);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  });
}
