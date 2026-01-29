"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupervisorRouter = void 0;
const express_1 = require("express");
const supervisor_controller_1 = require("../controllers/supervisor-controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../lib/database");
class SupervisorRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.supervisorController = new supervisor_controller_1.SupervisorController(database_1.prisma);
        this.setupRoutes();
    }
    setupRoutes() {
        // Get all activities - accessible by SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
        this.router.get("/activities", auth_middleware_1.authenticate, (req, res, next) => {
            // Allow ADMIN and SUPERADMIN roles
            if (req.user?.role === "ADMIN" || req.user?.role === "SUPERADMIN") {
                next();
                return;
            }
            // Allow PLANNER, SUPERVISOR (maps to PLANNER), DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN) posisi
            if (req.user?.posisi === "PLANNER" ||
                req.user?.posisi === "SUPERVISOR" ||
                req.user?.posisi === "DEPT_HEAD" ||
                req.user?.posisi === "MANAGEMENT") {
                next();
                return;
            }
            res.status(403).json({
                success: false,
                message: "Insufficient permissions. Only SUPERVISOR, PLANNER, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
            });
        }, (req, res) => this.supervisorController.getAllActivities(req, res));
        // Assign mechanics to activity - MUST be before /activities/:id to avoid route conflict
        // SUPERVISOR can assign mechanics (maps to PLANNER access)
        this.router.post("/activities/:id/assign-mechanics", auth_middleware_1.authenticate, (req, res, next) => {
            // Allow ADMIN and SUPERADMIN roles
            if (req.user?.role === "ADMIN" || req.user?.role === "SUPERADMIN") {
                next();
                return;
            }
            // Allow GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, PLANNER, and SUPERVISOR posisi (SUPERVISOR maps to PLANNER)
            if (req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
                req.user?.posisi === "GROUP_LEADER_TYRE" ||
                req.user?.posisi === "PLANNER" ||
                req.user?.posisi === "SUPERVISOR") {
                next();
                return;
            }
            res.status(403).json({
                success: false,
                message: "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, PLANNER, SUPERVISOR, ADMIN, or SUPERADMIN can access.",
            });
        }, (req, res) => this.supervisorController.assignMechanics(req, res));
        // Get activity by id - accessible by SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
        this.router.get("/activities/:id", auth_middleware_1.authenticate, (req, res, next) => {
            // Allow ADMIN and SUPERADMIN roles
            if (req.user?.role === "ADMIN" || req.user?.role === "SUPERADMIN") {
                next();
                return;
            }
            // Allow PLANNER, SUPERVISOR (maps to PLANNER), DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN) posisi
            if (req.user?.posisi === "PLANNER" ||
                req.user?.posisi === "SUPERVISOR" ||
                req.user?.posisi === "DEPT_HEAD" ||
                req.user?.posisi === "MANAGEMENT") {
                next();
                return;
            }
            res.status(403).json({
                success: false,
                message: "Insufficient permissions. Only SUPERVISOR, PLANNER, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
            });
        }, (req, res) => this.supervisorController.getActivityById(req, res));
        // Get mechanics - accessible by GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, SUPERVISOR (maps to PLANNER), ADMIN, SUPERADMIN, DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN)
        this.router.get("/mechanics", auth_middleware_1.authenticate, (req, res, next) => {
            // Allow ADMIN and SUPERADMIN roles
            if (req.user?.role === "ADMIN" || req.user?.role === "SUPERADMIN") {
                next();
                return;
            }
            // Allow GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, PLANNER, SUPERVISOR (maps to PLANNER), DEPT_HEAD, MANAGEMENT (maps to SUPERADMIN) posisi
            if (req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
                req.user?.posisi === "GROUP_LEADER_TYRE" ||
                req.user?.posisi === "PLANNER" ||
                req.user?.posisi === "SUPERVISOR" ||
                req.user?.posisi === "DEPT_HEAD" ||
                req.user?.posisi === "MANAGEMENT") {
                next();
                return;
            }
            res.status(403).json({
                success: false,
                message: "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, PLANNER, SUPERVISOR, ADMIN, SUPERADMIN, DEPT_HEAD, or MANAGEMENT can access.",
            });
        }, (req, res) => this.supervisorController.getMechanics(req, res));
    }
    getRouter() {
        return this.router;
    }
}
exports.SupervisorRouter = SupervisorRouter;
