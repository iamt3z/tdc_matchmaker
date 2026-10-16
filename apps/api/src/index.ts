import express from "express";
import cors, { type CorsOptions } from "cors";

import { customerRouter } from "./routes/customer.routes";
import { authRouter } from "./routes/auth.routes";
import { matchRouter } from "./routes/match.routes";
import { errorHandler } from "./middleware/error-handler";

const app = express();

const allowedOrigins = (
  process.env.FRONTEND_URL ??
  "http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header.
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.trim().replace(/\/+$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.error(
      `CORS blocked origin: ${origin}. Allowed origins: ${allowedOrigins.join(", ")}`
    );

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/customers", customerRouter);
app.use("/api/matches", matchRouter);

app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on port ${port}`);
});