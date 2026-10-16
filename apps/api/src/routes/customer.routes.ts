import { Router } from "express";
import { z } from "zod";

import type { CustomerStatus } from "@tdc/types";
import { customerService } from "../services/customer.service";
import { noteService } from "../services/note.service";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../validators/customer.schema";
import { createNoteSchema } from "../validators/note.schema";

import {
  authenticate,
  type AuthenticatedRequest,
} from "../middleware/authnticate";
import { AppError } from "../middleware/error-handler";

export const customerRouter: Router = Router();

// All customer endpoints require a verified matchmaker identity.
// Development hardcoding of matchmaker IDs is intentionally removed.
customerRouter.use(authenticate);

const listQuerySchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  status: z
    .enum([
      "NEW",
      "PROFILE_INCOMPLETE",
      "READY_FOR_MATCHING",
      "MATCHES_SUGGESTED",
      "INTRODUCTION_SENT",
      "AWAITING_FEEDBACK",
      "ON_HOLD",
    ])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

customerRouter.get("/", async (req, res, next) => {
  try {
    // Authenticated token is the only trusted source for matchmaker identity.
    const matchmakerId = (req as AuthenticatedRequest).auth?.matchmakerId;

    if (!matchmakerId) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required",
        },
      });
      return;
    }

    const query = listQuerySchema.safeParse(req.query);

    if (!query.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid customer list parameters",
        },
      });
      return;
    }

    const result = await customerService.list({
      ...query.data,
      matchmakerId,
      status: query.data.status as CustomerStatus | undefined,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * Notes routes are registered before /:id so Express does not treat
 * the literal segment "notes" as a customer id parameter.
 */
customerRouter.get("/:customerId/notes", async (req, res, next) => {
  try {
    const matchmakerId = (req as AuthenticatedRequest).auth?.matchmakerId;

    if (!matchmakerId) {
      throw new AppError(
        "UNAUTHENTICATED",
        "Authentication is required",
        401,
      );
    }

    const notes = await noteService.listForCustomer(
      req.params.customerId,
      matchmakerId,
    );

    res.json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
});

customerRouter.post("/:customerId/notes", async (req, res, next) => {
  try {
    const matchmakerId = (req as AuthenticatedRequest).auth?.matchmakerId;

    if (!matchmakerId) {
      throw new AppError(
        "UNAUTHENTICATED",
        "Authentication is required",
        401,
      );
    }

    const parsed = createNoteSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid note data",
          details: parsed.error.flatten(),
        },
      });
      return;
    }

    const note = await noteService.create(
      req.params.customerId,
      parsed.data,
      matchmakerId,
    );

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
});

customerRouter.get("/:id", async (req, res, next) => {
  try {
    const matchmakerId = (req as AuthenticatedRequest).auth?.matchmakerId;

    if (!matchmakerId) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required",
        },
      });
      return;
    }

    const customer = await customerService.getById(req.params.id, matchmakerId);

    if (!customer) {
      res.status(404).json({
        success: false,
        error: {
          code: "CUSTOMER_NOT_FOUND",
          message: "Customer not found",
        },
      });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});

customerRouter.post("/", async (req, res, next) => {
  try {
    const matchmakerId = (req as AuthenticatedRequest).auth?.matchmakerId;

    if (!matchmakerId) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required",
        },
      });
      return;
    }

    const parsed = createCustomerSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid customer data",
          details: parsed.error.flatten(),
        },
      });
      return;
    }

    const customer = await customerService.create(parsed.data, matchmakerId);

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});

customerRouter.patch("/:id", async (req, res, next) => {
  try {
    const matchmakerId = (req as AuthenticatedRequest).auth?.matchmakerId;

    if (!matchmakerId) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required",
        },
      });
      return;
    }

    const parsed = updateCustomerSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid customer update",
        },
      });
      return;
    }

    const customer = await customerService.update(
      req.params.id,
      parsed.data,
      matchmakerId,
    );

    if (!customer) {
      res.status(404).json({
        success: false,
        error: {
          code: "CUSTOMER_NOT_FOUND",
          message: "Customer not found",
        },
      });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});
