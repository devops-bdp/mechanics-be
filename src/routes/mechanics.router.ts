import { Router } from "express";
import { MechanicsController } from "../controllers/mechanics-controller";
import { authenticate } from "../middleware/auth.middleware";
import { prisma } from "../lib/database";

export class MechanicsRouter {
  private router: Router;
  private mechanicsController: MechanicsController;

  constructor() {
    this.router = Router();
    this.mechanicsController = new MechanicsController(prisma);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Create work time - protected route, mechanics can create their own work time
    this.router.post("/work-times", authenticate, (req, res) =>
      this.mechanicsController.createWorkTime(req, res)
    );

    // Get all work times - protected route, mechanics see their own, admin see all
    this.router.get("/work-times", authenticate, (req, res) =>
      this.mechanicsController.getAllWorkTimes(req, res)
    );

    // Get work time by id - protected route
    this.router.get("/work-times/:id", authenticate, (req, res) =>
      this.mechanicsController.getWorkTimeById(req, res)
    );

    // Update work time - protected route, mechanics can update their own
    this.router.put("/work-times/:id", authenticate, (req, res) =>
      this.mechanicsController.updateWorkTime(req, res)
    );

    // Delete work time - protected route, mechanics can delete their own
    this.router.delete("/work-times/:id", authenticate, (req, res) =>
      this.mechanicsController.deleteWorkTime(req, res)
    );

    // Get my assigned activities - protected route
    this.router.get("/activities", authenticate, (req, res) =>
      this.mechanicsController.getMyActivities(req, res)
    );

    // Start task - protected route (MUST be before /activities/:activityId/start to avoid route conflict)
    this.router.post(
      "/activities/:activityId/tasks/start",
      authenticate,
      (req, res) => this.mechanicsController.startTask(req, res)
    );

    // Stop task - protected route (MUST be before /activities/:activityId/stop to avoid route conflict)
    this.router.post(
      "/activities/:activityId/tasks/stop",
      authenticate,
      (req, res) => this.mechanicsController.stopTask(req, res)
    );

    // Start activity - protected route
    this.router.post(
      "/activities/:activityId/start",
      authenticate,
      (req, res) => this.mechanicsController.startActivity(req, res)
    );

    // Pause activity - protected route
    this.router.post(
      "/activities/:activityId/pause",
      authenticate,
      (req, res) => this.mechanicsController.pauseActivity(req, res)
    );

    // Resume activity - protected route
    this.router.post(
      "/activities/:activityId/resume",
      authenticate,
      (req, res) => this.mechanicsController.resumeActivity(req, res)
    );

    // Stop activity - protected route
    this.router.post("/activities/:activityId/stop", authenticate, (req, res) =>
      this.mechanicsController.stopActivity(req, res)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
