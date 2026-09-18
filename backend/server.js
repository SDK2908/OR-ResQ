/**
 * OR-ResQ — Dynamic Operating Room Optimization & Recovery Engine
 * Backend Server: server.js
 */

import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import scheduleRoutes from "./routes/scheduleRoutes.js";

const app = express();
const PORT = process.env.BACKEND_PORT || 5001;

// Enable CORS for frontend communication
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Mount API routes
app.use("/api", scheduleRoutes);

// Root health and readiness
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", service: "OR-ResQ Backend Server" });
});

// Start server if run directly (standalone backend)
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  // Standalone root diagnostic info
  app.get("/", (req, res) => {
    res.status(200).json({
      service: "OR-ResQ — Dynamic Operating Room Optimization & Recovery Engine",
      endpoints: [
        "GET /api/health",
        "GET /api/demo-data",
        "POST /api/schedule/generate",
        "POST /api/recovery/simulate",
        "GET /api/schedule/current",
        "POST /api/recovery/apply",
        "POST /api/schedule/reset"
      ]
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OR-ResQ Engine] Server listening on http://0.0.0.0:${PORT}`);
  });
}

export default app;
