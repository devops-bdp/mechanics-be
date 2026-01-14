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
    // Assign mechanics to activity - only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, SUPERVISOR, ADMIN, SUPERADMIN can access
    this.router.post(
      "/activities/:id/assign-mechanics",
      authenticate,
      (req, res, next) => {
        if (
          req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
          req.user?.posisi === "GROUP_LEADER_TYRE" ||
          req.user?.posisi === "SUPERVISOR" ||
          req.user?.role === "ADMIN" ||
          req.user?.role === "SUPERADMIN"
        ) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message:
              "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, SUPERVISOR, ADMIN, or SUPERADMIN can access.",
          });
        }
      },
      (req, res) => this.supervisorController.assignMechanics(req, res)
    );

    // Get mechanics - accessible by GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, SUPERVISOR, ADMIN, SUPERADMIN
    this.router.get(
      "/mechanics",
      authenticate,
      (req, res, next) => {
        if (
          req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
          req.user?.posisi === "GROUP_LEADER_TYRE" ||
          req.user?.posisi === "SUPERVISOR" ||
          req.user?.role === "ADMIN" ||
          req.user?.role === "SUPERADMIN"
        ) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message:
              "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, SUPERVISOR, ADMIN, or SUPERADMIN can access.",
          });
        }
      },
      (req, res) => this.supervisorController.getMechanics(req, res)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

