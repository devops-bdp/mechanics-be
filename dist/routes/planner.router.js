"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlannerRouter = void 0;
const express_1 = require("express");
const planner_controller_1 = require("../controllers/planner-controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../lib/database");
class PlannerRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.plannerController = new planner_controller_1.PlannerController(database_1.prisma);
        this.setupRoutes();
    }
    setupRoutes() {
        // Create activity and assign mechanic - only PLANNER posisi, ADMIN, SUPERADMIN can access
        this.router.post("/activities", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.posisi === "PLANNER" ||
                req.user?.role === "ADMIN" ||
                req.user?.role === "SUPERADMIN") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions. Only PLANNER, ADMIN, or SUPERADMIN can access.",
                });
            }
        }, (req, res) => this.plannerController.createActivity(req, res));
        // Get all activities - protected route, requires authentication
        this.router.get("/activities", auth_middleware_1.authenticate, (req, res) => this.plannerController.getAllActivities(req, res));
        // Get activity by id - protected route, requires authentication
        this.router.get("/activities/:id", auth_middleware_1.authenticate, (req, res) => this.plannerController.getActivityById(req, res));
        // Update activity - only PLANNER posisi, ADMIN, SUPERADMIN can access
        this.router.put("/activities/:id", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.posisi === "PLANNER" ||
                req.user?.role === "ADMIN" ||
                req.user?.role === "SUPERADMIN") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions. Only PLANNER, ADMIN, or SUPERADMIN can access.",
                });
            }
        }, (req, res) => this.plannerController.updateActivity(req, res));
        // Get mechanics - accessible by PLANNER, ADMIN, SUPERADMIN
        this.router.get("/mechanics", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.posisi === "PLANNER" ||
                req.user?.role === "ADMIN" ||
                req.user?.role === "SUPERADMIN") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions. Only PLANNER, ADMIN, or SUPERADMIN can access.",
                });
            }
        }, (req, res) => this.plannerController.getMechanics(req, res));
        // Get breakdown units report - accessible by PLANNER, ADMIN, SUPERADMIN
        this.router.get("/unit-report/breakdown", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.posisi === "PLANNER" ||
                req.user?.role === "ADMIN" ||
                req.user?.role === "SUPERADMIN") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions. Only PLANNER, ADMIN, or SUPERADMIN can access.",
                });
            }
        }, (req, res) => this.plannerController.getBreakdownUnitsReport(req, res));
        // Get mechanics report - accessible by PLANNER, ADMIN, SUPERADMIN
        this.router.get("/mechanics-report", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.posisi === "PLANNER" ||
                req.user?.role === "ADMIN" ||
                req.user?.role === "SUPERADMIN") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions. Only PLANNER, ADMIN, or SUPERADMIN can access.",
                });
            }
        }, (req, res) => this.plannerController.getMechanicsReport(req, res));
        // Get activity analytics - accessible by PLANNER, ADMIN, SUPERADMIN
        this.router.get("/analytics/activities", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.posisi === "PLANNER" ||
                req.user?.role === "ADMIN" ||
                req.user?.role === "SUPERADMIN") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions. Only PLANNER, ADMIN, or SUPERADMIN can access.",
                });
            }
        }, (req, res) => this.plannerController.getActivityAnalytics(req, res));
        // Get unit analytics - accessible by PLANNER, ADMIN, SUPERADMIN
        this.router.get("/analytics/units", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.posisi === "PLANNER" ||
                req.user?.role === "ADMIN" ||
                req.user?.role === "SUPERADMIN") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions. Only PLANNER, ADMIN, or SUPERADMIN can access.",
                });
            }
        }, (req, res) => this.plannerController.getUnitAnalytics(req, res));
        // Get mechanics analytics - accessible by PLANNER, ADMIN, SUPERADMIN
        this.router.get("/analytics/mechanics", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.posisi === "PLANNER" ||
                req.user?.role === "ADMIN" ||
                req.user?.role === "SUPERADMIN") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions. Only PLANNER, ADMIN, or SUPERADMIN can access.",
                });
            }
        }, (req, res) => this.plannerController.getMechanicsAnalytics(req, res));
    }
    getRouter() {
        return this.router;
    }
}
exports.PlannerRouter = PlannerRouter;
