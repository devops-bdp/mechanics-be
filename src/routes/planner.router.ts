import { Router } from "express";
import { PlannerController } from "../controllers/planner-controller";
import {
  authenticate,
  authorize,
  authorizePosisi,
} from "../middleware/auth.middleware";
import { prisma } from "../lib/database";

export class PlannerRouter {
  private router: Router;
  private plannerController: PlannerController;

  constructor() {
    this.router = Router();
    this.plannerController = new PlannerController(prisma);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Create activity and assign mechanic - only PLANNER posisi, ADMIN, SUPERADMIN can access
    this.router.post(
      "/activities",
      authenticate,
      (req, res, next) => {
        if (
          req.user?.posisi === "PLANNER" ||
          req.user?.role === "ADMIN" ||
          req.user?.role === "SUPERADMIN"
        ) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message:
              "Insufficient permissions. Only PLANNER, ADMIN, or SUPERADMIN can access.",
          });
        }
      },
      (req, res) => this.plannerController.createActivity(req, res)
    );

    // Get all activities - protected route, requires authentication
    this.router.get("/activities", authenticate, (req, res) =>
      this.plannerController.getAllActivities(req, res)
    );

    // Get activity by id - protected route, requires authentication
    this.router.get("/activities/:id", authenticate, (req, res) =>
      this.plannerController.getActivityById(req, res)
    );

    // Update activity - only PLANNER posisi, ADMIN, SUPERADMIN can access
    this.router.put(
      "/activities/:id",
      authenticate,
      (req, res, next) => {
        if (
          req.user?.posisi === "PLANNER" ||
          req.user?.role === "ADMIN" ||
          req.user?.role === "SUPERADMIN"
        ) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message:
              "Insufficient permissions. Only PLANNER, ADMIN, or SUPERADMIN can access.",
          });
        }
      },
      (req, res) => this.plannerController.updateActivity(req, res)
    );

    // Get mechanics - accessible by PLANNER, ADMIN, SUPERADMIN
    this.router.get(
      "/mechanics",
      authenticate,
      (req, res, next) => {
        if (
          req.user?.posisi === "PLANNER" ||
          req.user?.role === "ADMIN" ||
          req.user?.role === "SUPERADMIN"
        ) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message:
              "Insufficient permissions. Only PLANNER, ADMIN, or SUPERADMIN can access.",
          });
        }
      },
      (req, res) => this.plannerController.getMechanics(req, res)
    );

    // Get breakdown units report - accessible by PLANNER, ADMIN, SUPERADMIN
    this.router.get(
      "/unit-report/breakdown",
      authenticate,
      (req, res, next) => {
        if (
          req.user?.posisi === "PLANNER" ||
          req.user?.role === "ADMIN" ||
          req.user?.role === "SUPERADMIN"
        ) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message:
              "Insufficient permissions. Only PLANNER, ADMIN, or SUPERADMIN can access.",
          });
        }
      },
      (req, res) => this.plannerController.getBreakdownUnitsReport(req, res)
    );

    // Get mechanics report - accessible by PLANNER, ADMIN, SUPERADMIN
    this.router.get(
      "/mechanics-report",
      authenticate,
      (req, res, next) => {
        if (
          req.user?.posisi === "PLANNER" ||
          req.user?.role === "ADMIN" ||
          req.user?.role === "SUPERADMIN"
        ) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message:
              "Insufficient permissions. Only PLANNER, ADMIN, or SUPERADMIN can access.",
          });
        }
      },
      (req, res) => this.plannerController.getMechanicsReport(req, res)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
