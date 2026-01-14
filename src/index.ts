import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { AuthRouter } from "./routes/auth.router";
import { UnitRouter } from "./routes/unit.router";
import { PlannerRouter } from "./routes/planner.router";
import { MechanicsRouter } from "./routes/mechanics.router";
import { SuperAdminRouter } from "./routes/superadmin.router";
import { SupervisorRouter } from "./routes/supervisor.router";
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
const authRouter = new AuthRouter();
const unitRouter = new UnitRouter();
const plannerRouter = new PlannerRouter();
const mechanicsRouter = new MechanicsRouter();
const superAdminRouter = new SuperAdminRouter();
const supervisorRouter = new SupervisorRouter();

app.use("/api/auth", authRouter.getRouter());
app.use("/api/units", unitRouter.getRouter());
app.use("/api/planner", plannerRouter.getRouter());
app.use("/api/mechanics", mechanicsRouter.getRouter());
app.use("/api/superadmin", superAdminRouter.getRouter());
app.use("/api/supervisor", supervisorRouter.getRouter());

// Error handling for JSON parsing and other errors
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }

    if (err) {
      console.error("Error:", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }

    next();
  }
);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// Local development
const PORT = process.env.PORT || 8000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// CRITICAL: Export for Vercel
export default app;
