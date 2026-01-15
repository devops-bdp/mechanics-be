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
        // Get all users - only SUPERADMIN can access
        this.router.get("/users", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("SUPERADMIN"), (req, res) => this.superAdminController.getAllUsers(req, res));
        // Get user by id - only SUPERADMIN can access
        this.router.get("/users/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("SUPERADMIN"), (req, res) => this.superAdminController.getUserById(req, res));
        // Update user - only SUPERADMIN can access
        this.router.put("/users/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("SUPERADMIN"), (req, res) => this.superAdminController.updateUser(req, res));
        // Delete user - only SUPERADMIN can access
        this.router.delete("/users/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("SUPERADMIN"), (req, res) => this.superAdminController.deleteUser(req, res));
        // ==================== ACTIVITY MANAGEMENT ====================
        // Get all activities - only SUPERADMIN can access
        this.router.get("/activities", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("SUPERADMIN"), (req, res) => this.superAdminController.getAllActivities(req, res));
        // Delete activity - only SUPERADMIN can access
        this.router.delete("/activities/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("SUPERADMIN"), (req, res) => this.superAdminController.deleteActivity(req, res));
        // ==================== WORK TIME MANAGEMENT ====================
        // Get all work times - only SUPERADMIN can access
        this.router.get("/work-times", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("SUPERADMIN"), (req, res) => this.superAdminController.getAllWorkTimes(req, res));
        // Delete work time - only SUPERADMIN can access
        this.router.delete("/work-times/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("SUPERADMIN"), (req, res) => this.superAdminController.deleteWorkTime(req, res));
        // ==================== DASHBOARD / STATISTICS ====================
        // Get dashboard statistics - only SUPERADMIN can access
        this.router.get("/dashboard/stats", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("SUPERADMIN"), (req, res) => this.superAdminController.getDashboardStats(req, res));
    }
    getRouter() {
        return this.router;
    }
}
exports.SuperAdminRouter = SuperAdminRouter;
