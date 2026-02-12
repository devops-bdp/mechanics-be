import { Router } from "express";
import { PlannerController } from "../controllers/planner-controller";
import {
  authenticate,
  authorize,
  authorizePosisi,
  authorizeWrite,
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
    // Create activity and assign mechanic - PLANNER, SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN) can access
    this.router.post(
      "/activities",
      authenticate,
      authorizeWrite(),
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
            "Insufficient permissions. Only PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
        });
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

    // Assign Group Leader to activity - MUST be before /activities/:id to avoid route conflict
    this.router.post(
      "/activities/:id/assign-group-leader",
      authenticate,
      authorizeWrite(),
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
            "Insufficient permissions. Only PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
        });
      },
      (req, res) => this.plannerController.assignGroupLeader(req, res)
    );

    // Update activity - PLANNER, SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN) can access
    this.router.put(
      "/activities/:id",
      authenticate,
      authorizeWrite(),
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
            "Insufficient permissions. Only PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
        });
      },
      (req, res) => this.plannerController.updateActivity(req, res)
    );

    // Get group leaders - accessible by PLANNER, SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
    this.router.get(
      "/group-leaders",
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
            "Insufficient permissions. Only PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
        });
      },
      (req, res) => this.plannerController.getGroupLeaders(req, res)
    );

    // Get mechanics - accessible by PLANNER, SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
    this.router.get(
      "/mechanics",
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
            "Insufficient permissions. Only PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
        });
      },
      (req, res) => this.plannerController.getMechanics(req, res)
    );

    // Get breakdown units report - accessible by PLANNER, SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
    this.router.get(
      "/unit-report/breakdown",
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
            "Insufficient permissions. Only PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
        });
      },
      (req, res) => this.plannerController.getBreakdownUnitsReport(req, res)
    );

    // Get mechanics report - accessible by PLANNER, SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
    this.router.get(
      "/mechanics-report",
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
            "Insufficient permissions. Only PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
        });
      },
      (req, res) => this.plannerController.getMechanicsReport(req, res)
    );

    // Download mechanics report PDF - MUST be before /:mechanicId route
    this.router.get(
      "/mechanics-report/download/pdf",
      authenticate,
      (req, res, next) => {
        if (req.user?.role === "ADMIN" || req.user?.role === "SUPERADMIN") {
          next();
          return;
        }
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
          message: "Insufficient permissions.",
        });
      },
      (req, res) => this.plannerController.downloadMechanicsReportPDF(req, res)
    );

    // Download mechanics report Excel
    this.router.get(
      "/mechanics-report/download/excel",
      authenticate,
      (req, res, next) => {
        if (req.user?.role === "ADMIN" || req.user?.role === "SUPERADMIN") {
          next();
          return;
        }
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
          message: "Insufficient permissions.",
        });
      },
      (req, res) => this.plannerController.downloadMechanicsReportExcel(req, res)
    );

    // Get single mechanic report by ID - MUST be after download routes to avoid route conflicts
    this.router.get(
      "/mechanics-report/:mechanicId",
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
            "Insufficient permissions. Only PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
        });
      },
      (req, res) => this.plannerController.getMechanicReportById(req, res)
    );

    // Get activity analytics - accessible by PLANNER, SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
    this.router.get(
      "/analytics/activities",
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
            "Insufficient permissions. Only PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
        });
      },
      (req, res) => this.plannerController.getActivityAnalytics(req, res)
    );

    // Get unit analytics - accessible by PLANNER, SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
    this.router.get(
      "/analytics/units",
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
            "Insufficient permissions. Only PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
        });
      },
      (req, res) => this.plannerController.getUnitAnalytics(req, res)
    );

    // Get mechanics analytics - accessible by PLANNER, SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
    this.router.get(
      "/analytics/mechanics",
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
            "Insufficient permissions. Only PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
        });
      },
      (req, res) => this.plannerController.getMechanicsAnalytics(req, res)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
