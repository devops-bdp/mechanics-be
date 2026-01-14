import { Router } from "express";
import { SuperAdminController } from "../controllers/superadmin-controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { prisma } from "../lib/database";

export class SuperAdminRouter {
  private router: Router;
  private superAdminController: SuperAdminController;

  constructor() {
    this.router = Router();
    this.superAdminController = new SuperAdminController(prisma);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // ==================== USER MANAGEMENT ====================
    
    // Get all users - only SUPERADMIN can access
    this.router.get(
      "/users",
      authenticate,
      authorize("SUPERADMIN"),
      (req, res) => this.superAdminController.getAllUsers(req, res)
    );

    // Get user by id - only SUPERADMIN can access
    this.router.get(
      "/users/:id",
      authenticate,
      authorize("SUPERADMIN"),
      (req, res) => this.superAdminController.getUserById(req, res)
    );

    // Update user - only SUPERADMIN can access
    this.router.put(
      "/users/:id",
      authenticate,
      authorize("SUPERADMIN"),
      (req, res) => this.superAdminController.updateUser(req, res)
    );

    // Delete user - only SUPERADMIN can access
    this.router.delete(
      "/users/:id",
      authenticate,
      authorize("SUPERADMIN"),
      (req, res) => this.superAdminController.deleteUser(req, res)
    );

    // ==================== ACTIVITY MANAGEMENT ====================

    // Get all activities - only SUPERADMIN can access
    this.router.get(
      "/activities",
      authenticate,
      authorize("SUPERADMIN"),
      (req, res) => this.superAdminController.getAllActivities(req, res)
    );

    // Delete activity - only SUPERADMIN can access
    this.router.delete(
      "/activities/:id",
      authenticate,
      authorize("SUPERADMIN"),
      (req, res) => this.superAdminController.deleteActivity(req, res)
    );

    // ==================== WORK TIME MANAGEMENT ====================

    // Get all work times - only SUPERADMIN can access
    this.router.get(
      "/work-times",
      authenticate,
      authorize("SUPERADMIN"),
      (req, res) => this.superAdminController.getAllWorkTimes(req, res)
    );

    // Delete work time - only SUPERADMIN can access
    this.router.delete(
      "/work-times/:id",
      authenticate,
      authorize("SUPERADMIN"),
      (req, res) => this.superAdminController.deleteWorkTime(req, res)
    );

    // ==================== DASHBOARD / STATISTICS ====================

    // Get dashboard statistics - only SUPERADMIN can access
    this.router.get(
      "/dashboard/stats",
      authenticate,
      authorize("SUPERADMIN"),
      (req, res) => this.superAdminController.getDashboardStats(req, res)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
