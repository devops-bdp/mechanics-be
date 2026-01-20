import { Router } from "express";
import { UnitController } from "../controllers/unit-controllers";
import { authenticate, authorize, authorizePosisi } from "../middleware/auth.middleware";
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

    // Create unit - protected route, allows PLANNER (posisi), ADMIN, and SUPERADMIN (role)
    this.router.post(
      "/",
      authenticate,
      (req, res, next) => {
        if (!req.user) {
          res.status(401).json({
            success: false,
            message: "Authentication required",
          });
          return;
        }
        // Allow if user has ADMIN or SUPERADMIN role, OR has PLANNER posisi
        if (
          req.user.role === "ADMIN" ||
          req.user.role === "SUPERADMIN" ||
          req.user.posisi === "PLANNER"
        ) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message: "Insufficient permissions. Only PLANNER, ADMIN, and SUPERADMIN can create units.",
          });
        }
      },
      (req, res) => this.unitController.create(req, res)
    );

    // Update unit - protected route, allows PLANNER (posisi), ADMIN, and SUPERADMIN (role)
    this.router.put(
      "/:id",
      authenticate,
      (req, res, next) => {
        if (!req.user) {
          res.status(401).json({
            success: false,
            message: "Authentication required",
          });
          return;
        }
        // Allow if user has ADMIN or SUPERADMIN role, OR has PLANNER posisi
        if (
          req.user.role === "ADMIN" ||
          req.user.role === "SUPERADMIN" ||
          req.user.posisi === "PLANNER"
        ) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message: "Insufficient permissions. Only PLANNER, ADMIN, and SUPERADMIN can update units.",
          });
        }
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

    // Bulk create units - protected route, allows PLANNER (posisi), ADMIN, and SUPERADMIN (role)
    this.router.post(
      "/bulk-create",
      authenticate,
      (req, res, next) => {
        if (!req.user) {
          res.status(401).json({
            success: false,
            message: "Authentication required",
          });
          return;
        }
        // Allow if user has ADMIN or SUPERADMIN role, OR has PLANNER posisi
        if (
          req.user.role === "ADMIN" ||
          req.user.role === "SUPERADMIN" ||
          req.user.posisi === "PLANNER"
        ) {
          next();
        } else {
          res.status(403).json({
            success: false,
            message: "Insufficient permissions. Only PLANNER, ADMIN, and SUPERADMIN can bulk create units.",
          });
        }
      },
      (req, res) => this.unitController.bulkCreate(req, res)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
