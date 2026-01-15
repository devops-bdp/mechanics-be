"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitRouter = void 0;
const express_1 = require("express");
const unit_controllers_1 = require("../controllers/unit-controllers");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../lib/database");
class UnitRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.unitController = new unit_controllers_1.UnitController(database_1.prisma);
        this.setupRoutes();
    }
    setupRoutes() {
        // Get all units - public route (or can be protected if needed)
        this.router.get("/", (req, res) => this.unitController.getAll(req, res));
        // Get unit by id - public route (or can be protected if needed)
        this.router.get("/:id", (req, res) => this.unitController.getById(req, res));
        // Create unit - protected route, allows PLANNER (posisi), ADMIN, and SUPERADMIN (role)
        this.router.post("/", auth_middleware_1.authenticate, (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
            // Allow if user has ADMIN or SUPERADMIN role, OR has PLANNER posisi
            if (req.user.role === "ADMIN" ||
                req.user.role === "SUPERADMIN" ||
                req.user.posisi === "PLANNER") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions. Only PLANNER, ADMIN, and SUPERADMIN can create units.",
                });
            }
        }, (req, res) => this.unitController.create(req, res));
        // Update unit - protected route, allows PLANNER (posisi), ADMIN, and SUPERADMIN (role)
        this.router.put("/:id", auth_middleware_1.authenticate, (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
            // Allow if user has ADMIN or SUPERADMIN role, OR has PLANNER posisi
            if (req.user.role === "ADMIN" ||
                req.user.role === "SUPERADMIN" ||
                req.user.posisi === "PLANNER") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions. Only PLANNER, ADMIN, and SUPERADMIN can update units.",
                });
            }
        }, (req, res) => this.unitController.update(req, res));
        // Delete unit - protected route, only ADMIN and SUPERADMIN can access
        this.router.delete("/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("ADMIN", "SUPERADMIN"), (req, res) => this.unitController.delete(req, res));
    }
    getRouter() {
        return this.router;
    }
}
exports.UnitRouter = UnitRouter;
