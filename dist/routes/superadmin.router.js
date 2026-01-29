"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminRouter = void 0;
const express_1 = require("express");
const superadmin_controller_1 = require("../controllers/superadmin-controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../lib/database");
class SuperAdminRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.superAdminController = new superadmin_controller_1.SuperAdminController(database_1.prisma);
        this.setupRoutes();
    }
    setupRoutes() {
        // ==================== USER MANAGEMENT ====================
        // Get all users - SUPERADMIN role or DEPT_HEAD/MANAGEMENT posisi (maps to SUPERADMIN) can access
        this.router.get("/users", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.role === "SUPERADMIN" ||
                req.user?.posisi === "DEPT_HEAD" ||
                req.user?.posisi === "MANAGEMENT") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions",
                });
            }
        }, (req, res) => this.superAdminController.getAllUsers(req, res));
        // Get user by id - SUPERADMIN role or DEPT_HEAD/MANAGEMENT posisi (maps to SUPERADMIN) can access
        this.router.get("/users/:id", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.role === "SUPERADMIN" ||
                req.user?.posisi === "DEPT_HEAD" ||
                req.user?.posisi === "MANAGEMENT") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions",
                });
            }
        }, (req, res) => this.superAdminController.getUserById(req, res));
        // Update user - SUPERADMIN role or DEPT_HEAD/MANAGEMENT posisi (maps to SUPERADMIN) can access, but read-only if role is USERS
        this.router.put("/users/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeWrite)(), (req, res, next) => {
            if (req.user?.role === "SUPERADMIN" ||
                req.user?.posisi === "DEPT_HEAD" ||
                req.user?.posisi === "MANAGEMENT") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions",
                });
            }
        }, (req, res) => this.superAdminController.updateUser(req, res));
        // Delete user - only SUPERADMIN role can access (DEPT_HEAD/MANAGEMENT cannot delete)
        this.router.delete("/users/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("SUPERADMIN"), (req, res) => this.superAdminController.deleteUser(req, res));
        // Bulk create users - SUPERADMIN role or DEPT_HEAD/MANAGEMENT posisi (maps to SUPERADMIN) can access, but read-only if role is USERS
        this.router.post("/users/bulk-create", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeWrite)(), (req, res, next) => {
            if (req.user?.role === "SUPERADMIN" ||
                req.user?.posisi === "DEPT_HEAD" ||
                req.user?.posisi === "MANAGEMENT") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions",
                });
            }
        }, (req, res) => this.superAdminController.bulkCreateUsers(req, res));
        // Bulk delete users - only SUPERADMIN role can access (DEPT_HEAD/MANAGEMENT cannot delete)
        this.router.post("/users/bulk-delete", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("SUPERADMIN"), (req, res) => this.superAdminController.bulkDeleteUsers(req, res));
        // ==================== ACTIVITY MANAGEMENT ====================
        // Get all activities - SUPERADMIN role or DEPT_HEAD/MANAGEMENT posisi (maps to SUPERADMIN) can access
        this.router.get("/activities", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.role === "SUPERADMIN" ||
                req.user?.posisi === "DEPT_HEAD" ||
                req.user?.posisi === "MANAGEMENT") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions",
                });
            }
        }, (req, res) => this.superAdminController.getAllActivities(req, res));
        // Delete activity - only SUPERADMIN can access
        this.router.delete("/activities/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("SUPERADMIN"), (req, res) => this.superAdminController.deleteActivity(req, res));
        // ==================== WORK TIME MANAGEMENT ====================
        // Get all work times - SUPERADMIN role or DEPT_HEAD/MANAGEMENT posisi (maps to SUPERADMIN) can access
        this.router.get("/work-times", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.role === "SUPERADMIN" ||
                req.user?.posisi === "DEPT_HEAD" ||
                req.user?.posisi === "MANAGEMENT") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions",
                });
            }
        }, (req, res) => this.superAdminController.getAllWorkTimes(req, res));
        // Delete work time - only SUPERADMIN can access
        this.router.delete("/work-times/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("SUPERADMIN"), (req, res) => this.superAdminController.deleteWorkTime(req, res));
        // ==================== DASHBOARD / STATISTICS ====================
        // Get dashboard statistics - SUPERADMIN role or DEPT_HEAD/MANAGEMENT posisi (maps to SUPERADMIN) can access
        this.router.get("/dashboard/stats", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.role === "SUPERADMIN" ||
                req.user?.posisi === "DEPT_HEAD" ||
                req.user?.posisi === "MANAGEMENT") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions",
                });
            }
        }, (req, res) => this.superAdminController.getDashboardStats(req, res));
    }
    getRouter() {
        return this.router;
    }
}
exports.SuperAdminRouter = SuperAdminRouter;
