import { Router } from "express";
import { UnitController } from "../controllers/unit-controllers";
import { authenticate, authorize, authorizePosisi, authorizeWrite } from "../middleware/auth.middleware";
import { prisma } from "../lib/database";

export class UnitRouter {
  private router: Router;
  private unitController: UnitController;

  constructor() {
    this.router = Router();
    this.unitController = new UnitController(prisma);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Get all units - public route (or can be protected if needed)
    this.router.get("/", (req, res) => this.unitController.getAll(req, res));

    // Get unit by id - public route (or can be protected if needed)
    this.router.get("/:id", (req, res) =>
      this.unitController.getById(req, res)
    );

    // Create unit - protected route, allows PLANNER, SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
    this.router.post(
      "/",
      authenticate,
      authorizeWrite(),
      (req, res, next) => {
        if (!req.user) {
          res.status(401).json({
            success: false,
            message: "Authentication required",
          });
          return;
        }
        // Allow if user has ADMIN or SUPERADMIN role
        if (req.user.role === "ADMIN" || req.user.role === "SUPERADMIN") {
          next();
          return;
        }
        // Allow if user has PLANNER, SUPERVISOR (maps to PLANNER), DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN) posisi
        if (
          req.user.posisi === "PLANNER" ||
          req.user.posisi === "SUPERVISOR" ||
          req.user.posisi === "DEPT_HEAD" ||
          req.user.posisi === "MANAGEMENT"
        ) {
          next();
          return;
        }
        res.status(403).json({
          success: false,
          message: "Insufficient permissions. Only PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can create units.",
        });
      },
      (req, res) => this.unitController.create(req, res)
    );

    // Update unit - protected route, allows PLANNER, SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
    this.router.put(
      "/:id",
      authenticate,
      authorizeWrite(),
      (req, res, next) => {
        if (!req.user) {
          res.status(401).json({
            success: false,
            message: "Authentication required",
          });
          return;
        }
        // Allow if user has ADMIN or SUPERADMIN role
        if (req.user.role === "ADMIN" || req.user.role === "SUPERADMIN") {
          next();
          return;
        }
        // Allow if user has PLANNER, SUPERVISOR (maps to PLANNER), DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN) posisi
        if (
          req.user.posisi === "PLANNER" ||
          req.user.posisi === "SUPERVISOR" ||
          req.user.posisi === "DEPT_HEAD" ||
          req.user.posisi === "MANAGEMENT"
        ) {
          next();
          return;
        }
        res.status(403).json({
          success: false,
          message: "Insufficient permissions. Only PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can update units.",
        });
      },
      (req, res) => this.unitController.update(req, res)
    );

    // Delete unit - protected route, only ADMIN and SUPERADMIN can access
    this.router.delete(
      "/:id",
      authenticate,
      authorize("ADMIN", "SUPERADMIN"),
      (req, res) => this.unitController.delete(req, res)
    );

    // Bulk create units - protected route, allows PLANNER, SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
    this.router.post(
      "/bulk-create",
      authenticate,
      authorizeWrite(),
      (req, res, next) => {
        if (!req.user) {
          res.status(401).json({
            success: false,
            message: "Authentication required",
          });
          return;
        }
        // Allow if user has ADMIN or SUPERADMIN role
        if (req.user.role === "ADMIN" || req.user.role === "SUPERADMIN") {
          next();
          return;
        }
        // Allow if user has PLANNER, SUPERVISOR (maps to PLANNER), DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN) posisi
        if (
          req.user.posisi === "PLANNER" ||
          req.user.posisi === "SUPERVISOR" ||
          req.user.posisi === "DEPT_HEAD" ||
          req.user.posisi === "MANAGEMENT"
        ) {
          next();
          return;
        }
        res.status(403).json({
          success: false,
          message: "Insufficient permissions. Only PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can bulk create units.",
        });
      },
      (req, res) => this.unitController.bulkCreate(req, res)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
