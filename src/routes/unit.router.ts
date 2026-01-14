import { Router } from "express";
import { UnitController } from "../controllers/unit-controllers";
import { authenticate, authorize } from "../middleware/auth.middleware";
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

    // Create unit - protected route, requires authentication
    this.router.post("/", authenticate, (req, res) =>
      this.unitController.create(req, res)
    );

    // Update unit - protected route, only ADMIN and SUPERADMIN can access
    this.router.put(
      "/:id",
      authenticate,
      authorize("ADMIN", "SUPERADMIN"),
      (req, res) => this.unitController.update(req, res)
    );

    // Delete unit - protected route, only ADMIN and SUPERADMIN can access
    this.router.delete(
      "/:id",
      authenticate,
      authorize("ADMIN", "SUPERADMIN"),
      (req, res) => this.unitController.delete(req, res)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
