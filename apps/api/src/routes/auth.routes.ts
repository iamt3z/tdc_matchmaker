import { Router } from "express";
import { loginSchema } from "../validators/auth.schema";
import {
  authService,
  AuthenticationError,
} from "../services/auth.service";

export const authRouter: Router = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please provide a valid username and password",
          details: parsed.error.flatten(),
        },
      });
      return;
    }

    const result = await authService.login(
      parsed.data.username,
      parsed.data.password,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      const status = error.code === "ACCOUNT_DISABLED" ? 403 : 401;

      res.status(status).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    next(error);
  }
});