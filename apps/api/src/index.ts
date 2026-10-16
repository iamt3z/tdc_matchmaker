
import express from "express";
import cors, { type CorsOptions } from "cors";

import { customerRouter } from "./routes/customer.routes";
import { authRouter } from "./routes/auth.routes";
import { matchRouter } from "./routes/match.routes";
import { errorHandler } from "./middleware/error-handler";

const app = express();

// Configure allowed frontend origins.
// Set FRONTEND_URL in your environment variables.
const allowedOrigins = (
  process.env.FRONTEND_URL!
)
  .split(",")
  .map((origin) => origin.trim());

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header, such as
    // server-to-server requests and certain development tools.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`CORS blocked for origin: ${origin}`)
    );
  },

  // Allow cookies and authorization credentials when needed.
  credentials: true,

  // Supported HTTP methods.
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  // Headers your frontend may send.
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Register CORS before routes so headers are included
// in normal requests and preflight OPTIONS responses.
app.use(cors(corsOptions));

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Public authentication routes
app.use("/api/auth", authRouter);

// Protected routes
app.use("/api/customers", customerRouter);
app.use("/api/matches", matchRouter);

// Global error handler must remain last.
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
