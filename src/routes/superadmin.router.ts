import { Router } from "express";
import { SuperAdminController } from "../controllers/superadmin-controller";
import { authenticate, authorize, authorizePosisi, authorizeWrite } from "../middleware/auth.middleware";
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
    
    // Get all users - SUPERADMIN role or DEPT_HEAD/MANAGEMENT posisi (maps to SUPERADMIN) can access
    this.router.get(
      "/users",
      authenticate,
      (req, res, next) => {
        if (req.user?.role === "SUPERADMIN" || 
            req.user?.posisi === "DEPT_HEAD" || 
            req.user?.posisi === "MANAGEMENT") {
          next();
        } else {
          res.status(403).json({
            success: false,
            message: "Insufficient permissions",
          });
        }
      },
      (req, res) => this.superAdminController.getAllUsers(req, res)
    );

    // Get user by id - SUPERADMIN role or DEPT_HEAD/MANAGEMENT posisi (maps to SUPERADMIN) can access
    this.router.get(
      "/users/:id",
      authenticate,
      (req, res, next) => {
        if (req.user?.role === "SUPERADMIN" || 
            req.user?.posisi === "DEPT_HEAD" || 
            req.user?.posisi === "MANAGEMENT") {
          next();
        } else {
          res.status(403).json({
            success: false,
            message: "Insufficient permissions",
          });
        }
      },
      (req, res) => this.superAdminController.getUserById(req, res)
    );

    // Update user - SUPERADMIN role or DEPT_HEAD/MANAGEMENT posisi (maps to SUPERADMIN) can access, but read-only if role is USERS
    this.router.put(
      "/users/:id",
      authenticate,
      authorizeWrite(),
      (req, res, next) => {
        if (req.user?.role === "SUPERADMIN" || 
            req.user?.posisi === "DEPT_HEAD" || 
            req.user?.posisi === "MANAGEMENT") {
          next();
        } else {
          res.status(403).json({
            success: false,
            message: "Insufficient permissions",
          });
        }
      },
      (req, res) => this.superAdminController.updateUser(req, res)
    );

    // Delete user - only SUPERADMIN role can access (DEPT_HEAD/MANAGEMENT cannot delete)
    this.router.delete(
      "/users/:id",
      authenticate,
      authorize("SUPERADMIN"),
      (req, res) => this.superAdminController.deleteUser(req, res)
    );

    // Bulk create users - SUPERADMIN role or DEPT_HEAD/MANAGEMENT posisi (maps to SUPERADMIN) can access, but read-only if role is USERS
    this.router.post(
      "/users/bulk-create",
      authenticate,
      authorizeWrite(),
      (req, res, next) => {
        if (req.user?.role === "SUPERADMIN" || 
            req.user?.posisi === "DEPT_HEAD" || 
            req.user?.posisi === "MANAGEMENT") {
          next();
        } else {
          res.status(403).json({
            success: false,
            message: "Insufficient permissions",
          });
        }
      },
      (req, res) => this.superAdminController.bulkCreateUsers(req, res)
    );

    // Bulk delete users - only SUPERADMIN role can access (DEPT_HEAD/MANAGEMENT cannot delete)
    this.router.post(
      "/users/bulk-delete",
      authenticate,
      authorize("SUPERADMIN"),
      (req, res) => this.superAdminController.bulkDeleteUsers(req, res)
    );

    // ==================== ACTIVITY MANAGEMENT ====================

    // Get all activities - SUPERADMIN role or DEPT_HEAD/MANAGEMENT posisi (maps to SUPERADMIN) can access
    this.router.get(
      "/activities",
      authenticate,
      (req, res, next) => {
        if (req.user?.role === "SUPERADMIN" || 
            req.user?.posisi === "DEPT_HEAD" || 
            req.user?.posisi === "MANAGEMENT") {
          next();
        } else {
          res.status(403).json({
            success: false,
            message: "Insufficient permissions",
          });
        }
      },
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

    // Get all work times - SUPERADMIN role or DEPT_HEAD/MANAGEMENT posisi (maps to SUPERADMIN) can access
    this.router.get(
      "/work-times",
      authenticate,
      (req, res, next) => {
        if (req.user?.role === "SUPERADMIN" || 
            req.user?.posisi === "DEPT_HEAD" || 
            req.user?.posisi === "MANAGEMENT") {
          next();
        } else {
          res.status(403).json({
            success: false,
            message: "Insufficient permissions",
          });
        }
      },
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

    // Get dashboard statistics - SUPERADMIN role or DEPT_HEAD/MANAGEMENT posisi (maps to SUPERADMIN) can access
    this.router.get(
      "/dashboard/stats",
      authenticate,
      (req, res, next) => {
        if (req.user?.role === "SUPERADMIN" || 
            req.user?.posisi === "DEPT_HEAD" || 
            req.user?.posisi === "MANAGEMENT") {
          next();
        } else {
          res.status(403).json({
            success: false,
            message: "Insufficient permissions",
          });
        }
      },
      (req, res) => this.superAdminController.getDashboardStats(req, res)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
