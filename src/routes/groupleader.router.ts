import { Router } from "express";
import { GroupLeaderController } from "../controllers/groupleader-controller";
import { authenticate } from "../middleware/auth.middleware";
import { prisma } from "../lib/database";

export class GroupLeaderRouter {
  private router: Router;
  private groupLeaderController: GroupLeaderController;

  constructor() {
    this.router = Router();
    this.groupLeaderController = new GroupLeaderController(prisma);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Get all activities - accessible by GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, SUPERADMIN
    this.router.get(
      "/activities",
      authenticate,
      (req, res, next) => {
        if (
          req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
          req.user?.posisi === "GROUP_LEADER_TYRE" ||
          req.user?.role === "ADMIN" ||
          req.user?.role === "SUPERADMIN"
        ) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message:
              "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, or SUPERADMIN can access.",
          });
        }
      },
      (req, res) => this.groupLeaderController.getAllActivities(req, res)
    );

    // Assign mechanics to activity - MUST be before /activities/:id to avoid route conflict
    this.router.post(
      "/activities/:id/assign-mechanics",
      authenticate,
      (req, res, next) => {
        if (
          req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
          req.user?.posisi === "GROUP_LEADER_TYRE" ||
          req.user?.role === "ADMIN" ||
          req.user?.role === "SUPERADMIN"
        ) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message:
              "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, or SUPERADMIN can access.",
          });
        }
      },
      (req, res) => this.groupLeaderController.assignMechanics(req, res)
    );

    // Get activity by id - accessible by GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, SUPERADMIN
    this.router.get(
      "/activities/:id",
      authenticate,
      (req, res, next) => {
        if (
          req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
          req.user?.posisi === "GROUP_LEADER_TYRE" ||
          req.user?.role === "ADMIN" ||
          req.user?.role === "SUPERADMIN"
        ) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message:
              "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, or SUPERADMIN can access.",
          });
        }
      },
      (req, res) => this.groupLeaderController.getActivityById(req, res)
    );

    // Update activity - accessible by GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, SUPERADMIN
    this.router.put(
      "/activities/:id",
      authenticate,
      (req, res, next) => {
        if (
          req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
          req.user?.posisi === "GROUP_LEADER_TYRE" ||
          req.user?.role === "ADMIN" ||
          req.user?.role === "SUPERADMIN"
        ) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message:
              "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, or SUPERADMIN can access.",
          });
        }
      },
      (req, res) => this.groupLeaderController.updateActivity(req, res)
    );

    // Get mechanics - accessible by GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, SUPERADMIN
    this.router.get(
      "/mechanics",
      authenticate,
      (req, res, next) => {
        if (
          req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
          req.user?.posisi === "GROUP_LEADER_TYRE" ||
          req.user?.role === "ADMIN" ||
          req.user?.role === "SUPERADMIN"
        ) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message:
              "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, or SUPERADMIN can access.",
          });
        }
      },
      (req, res) => this.groupLeaderController.getMechanics(req, res)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

