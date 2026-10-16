import { Router } from "express";

import {
  authenticate,
  type AuthenticatedRequest,
} from "../middleware/authnticate";
import { AppError } from "../middleware/error-handler";
import { matchService } from "../services/match.service";
import { aiService } from "../services/ai.service";
import {
  generateMatchesSchema,
  updateMatchStatusSchema,
} from "../validators/match.schema";

export const matchRouter: Router = Router();

// Every match endpoint requires a verified matchmaker identity.
matchRouter.use(authenticate);

/**
 * POST /api/matches/generate
 * Rank and persist eligible candidates for an owned customer.
 */
matchRouter.post("/generate", async (req, res, next) => {
  try {
    // Never accept matchmakerId from the request body.
    // The authenticated token is the source of truth for ownership.
    const matchmakerId = (req as AuthenticatedRequest).auth?.matchmakerId;

    if (!matchmakerId) {
      throw new AppError(
        "UNAUTHENTICATED",
        "Authentication is required",
        401,
      );
    }

    const parsed = generateMatchesSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid generate-matches request",
          details: parsed.error.flatten(),
        },
      });
      return;
    }

    const suggestions = await matchService.generate(
      {
        customerId: parsed.data.customerId,
        limit: parsed.data.limit,
        includeUnverified: parsed.data.includeUnverified,
      },
      matchmakerId,
    );

    res.status(201).json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/matches/customer/:customerId
 * Return persisted matches where the given customer is the source.
 */
matchRouter.get("/customer/:customerId", async (req, res, next) => {
  try {
    const matchmakerId = (req as AuthenticatedRequest).auth?.matchmakerId;

    if (!matchmakerId) {
      throw new AppError(
        "UNAUTHENTICATED",
        "Authentication is required",
        401,
      );
    }

    const suggestions = await matchService.listForCustomer(
      req.params.customerId,
      matchmakerId,
    );

    res.json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/matches/:matchId
 * Retrieve a single match with ownership enforcement.
 */
matchRouter.get("/:matchId", async (req, res, next) => {
  try {
    const matchmakerId = (req as AuthenticatedRequest).auth?.matchmakerId;

    if (!matchmakerId) {
      throw new AppError(
        "UNAUTHENTICATED",
        "Authentication is required",
        401,
      );
    }

    const suggestion = await matchService.getById(
      req.params.matchId,
      matchmakerId,
    );

    res.json({ success: true, data: suggestion });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/matches/:matchId/status
 * Advance or close a match under explicit transition rules.
 */
matchRouter.patch("/:matchId/status", async (req, res, next) => {
  try {
    const matchmakerId = (req as AuthenticatedRequest).auth?.matchmakerId;

    if (!matchmakerId) {
      throw new AppError(
        "UNAUTHENTICATED",
        "Authentication is required",
        401,
      );
    }

    const parsed = updateMatchStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid match status update",
          details: parsed.error.flatten(),
        },
      });
      return;
    }

    const updated = await matchService.updateStatus(
      req.params.matchId,
      parsed.data.status,
      matchmakerId,
      parsed.data.feedback,
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/matches/:matchId/send
 * Mock send: transitions to SENT and records sentAt without delivering email.
 */
matchRouter.post("/:matchId/send", async (req, res, next) => {
  try {
    const matchmakerId = (req as AuthenticatedRequest).auth?.matchmakerId;

    if (!matchmakerId) {
      throw new AppError(
        "UNAUTHENTICATED",
        "Authentication is required",
        401,
      );
    }

    const result = await matchService.send(req.params.matchId, matchmakerId);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/matches/:matchId/ai-insights
 * LLM explanation for a persisted match. Does not change score or eligibility.
 * Requires OPENROUTER_API_KEY on the server.
 */
matchRouter.post("/:matchId/ai-insights", async (req, res, next) => {
  try {
    const matchmakerId = (req as AuthenticatedRequest).auth?.matchmakerId;

    if (!matchmakerId) {
      throw new AppError(
        "UNAUTHENTICATED",
        "Authentication is required",
        401,
      );
    }

    const insights = await aiService.generateInsights(
      req.params.matchId,
      matchmakerId,
    );

    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/matches/:matchId/ai-introduction
 * LLM draft introduction for matchmaker review. Does not send email.
 */
matchRouter.post("/:matchId/ai-introduction", async (req, res, next) => {
  try {
    const matchmakerId = (req as AuthenticatedRequest).auth?.matchmakerId;

    if (!matchmakerId) {
      throw new AppError(
        "UNAUTHENTICATED",
        "Authentication is required",
        401,
      );
    }

    const draft = await aiService.generateIntroduction(
      req.params.matchId,
      matchmakerId,
    );

    res.json({ success: true, data: draft });
  } catch (error) {
    next(error);
  }
});

