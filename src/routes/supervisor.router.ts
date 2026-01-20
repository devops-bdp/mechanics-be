import { Router } from "express";
import { SupervisorController } from "../controllers/supervisor-controller";
import { authenticate } from "../middleware/auth.middleware";
import { prisma } from "../lib/database";

export class SupervisorRouter {
  private router: Router;
  private supervisorController: SupervisorController;

  constructor() {
    this.router = Router();
    this.supervisorController = new SupervisorController(prisma);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Get all activities - accessible by SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
    this.router.get(
      "/activities",
      authenticate,
      (req, res, next) => {
        // Allow ADMIN and SUPERADMIN roles
        if (req.user?.role === "ADMIN" || req.user?.role === "SUPERADMIN") {
          next();
          return;
        }
        // Allow PLANNER, SUPERVISOR (maps to PLANNER), DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN) posisi
        if (
          req.user?.posisi === "PLANNER" ||
          req.user?.posisi === "SUPERVISOR" ||
          req.user?.posisi === "DEPT_HEAD" ||
          req.user?.posisi === "MANAGEMENT"
        ) {
          next();
          return;
        }
        res.status(403).json({
          success: false,
          message:
            "Insufficient permissions. Only SUPERVISOR, PLANNER, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
        });
      },
      (req, res) => this.supervisorController.getAllActivities(req, res)
    );

    // Assign mechanics to activity - MUST be before /activities/:id to avoid route conflict
    // SUPERVISOR can assign mechanics (maps to PLANNER access)
    this.router.post(
      "/activities/:id/assign-mechanics",
      authenticate,
      (req, res, next) => {
        // Allow ADMIN and SUPERADMIN roles
        if (req.user?.role === "ADMIN" || req.user?.role === "SUPERADMIN") {
          next();
          return;
        }
        // Allow GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, PLANNER, and SUPERVISOR posisi (SUPERVISOR maps to PLANNER)
        if (
          req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
          req.user?.posisi === "GROUP_LEADER_TYRE" ||
          req.user?.posisi === "PLANNER" ||
          req.user?.posisi === "SUPERVISOR"
        ) {
          next();
          return;
        }
        res.status(403).json({
          success: false,
          message:
            "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, PLANNER, SUPERVISOR, ADMIN, or SUPERADMIN can access.",
        });
      },
      (req, res) => this.supervisorController.assignMechanics(req, res)
    );

    // Get activity by id - accessible by SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
    this.router.get(
      "/activities/:id",
      authenticate,
      (req, res, next) => {
        // Allow ADMIN and SUPERADMIN roles
        if (req.user?.role === "ADMIN" || req.user?.role === "SUPERADMIN") {
          next();
          return;
        }
        // Allow PLANNER, SUPERVISOR (maps to PLANNER), DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN) posisi
        if (
          req.user?.posisi === "PLANNER" ||
          req.user?.posisi === "SUPERVISOR" ||
          req.user?.posisi === "DEPT_HEAD" ||
          req.user?.posisi === "MANAGEMENT"
        ) {
          next();
          return;
        }
        res.status(403).json({
          success: false,
          message:
            "Insufficient permissions. Only SUPERVISOR, PLANNER, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
        });
      },
      (req, res) => this.supervisorController.getActivityById(req, res)
    );

    // Get mechanics - accessible by GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
    this.router.get(
      "/mechanics",
      authenticate,
      (req, res, next) => {
        // Allow ADMIN and SUPERADMIN roles
        if (req.user?.role === "ADMIN" || req.user?.role === "SUPERADMIN") {
          next();
          return;
        }
        // Allow GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, PLANNER, SUPERVISOR (maps to PLANNER), DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN) posisi
        if (
          req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
          req.user?.posisi === "GROUP_LEADER_TYRE" ||
          req.user?.posisi === "PLANNER" ||
          req.user?.posisi === "SUPERVISOR" ||
          req.user?.posisi === "DEPT_HEAD" ||
          req.user?.posisi === "MANAGEMENT"
        ) {
          next();
          return;
        }
        res.status(403).json({
          success: false,
          message:
            "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
        });
      },
      (req, res) => this.supervisorController.getMechanics(req, res)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

