"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupLeaderRouter = void 0;
const express_1 = require("express");
const groupleader_controller_1 = require("../controllers/groupleader-controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../lib/database");
class GroupLeaderRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.groupLeaderController = new groupleader_controller_1.GroupLeaderController(database_1.prisma);
        this.setupRoutes();
    }
    setupRoutes() {
        // Get all activities - accessible by GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, SUPERADMIN
        this.router.get("/activities", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
                req.user?.posisi === "GROUP_LEADER_TYRE" ||
                req.user?.role === "ADMIN" ||
                req.user?.role === "SUPERADMIN") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, or SUPERADMIN can access.",
                });
            }
        }, (req, res) => this.groupLeaderController.getAllActivities(req, res));
        // Assign mechanics to activity - MUST be before /activities/:id to avoid route conflict
        this.router.post("/activities/:id/assign-mechanics", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
                req.user?.posisi === "GROUP_LEADER_TYRE" ||
                req.user?.role === "ADMIN" ||
                req.user?.role === "SUPERADMIN") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, or SUPERADMIN can access.",
                });
            }
        }, (req, res) => this.groupLeaderController.assignMechanics(req, res));
        // Get activity by id - accessible by GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, SUPERADMIN
        this.router.get("/activities/:id", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
                req.user?.posisi === "GROUP_LEADER_TYRE" ||
                req.user?.role === "ADMIN" ||
                req.user?.role === "SUPERADMIN") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, or SUPERADMIN can access.",
                });
            }
        }, (req, res) => this.groupLeaderController.getActivityById(req, res));
        // Update activity - accessible by GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, SUPERADMIN
        this.router.put("/activities/:id", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
                req.user?.posisi === "GROUP_LEADER_TYRE" ||
                req.user?.role === "ADMIN" ||
                req.user?.role === "SUPERADMIN") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, or SUPERADMIN can access.",
                });
            }
        }, (req, res) => this.groupLeaderController.updateActivity(req, res));
        // Get mechanics - accessible by GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, SUPERADMIN
        this.router.get("/mechanics", auth_middleware_1.authenticate, (req, res, next) => {
            if (req.user?.posisi === "GROUP_LEADER_MEKANIK" ||
                req.user?.posisi === "GROUP_LEADER_TYRE" ||
                req.user?.role === "ADMIN" ||
                req.user?.role === "SUPERADMIN") {
                next();
            }
            else {
                res.status(403).json({
                    success: false,
                    message: "Insufficient permissions. Only GROUP_LEADER_MEKANIK, GROUP_LEADER_TYRE, ADMIN, or SUPERADMIN can access.",
                });
            }
        }, (req, res) => this.groupLeaderController.getMechanics(req, res));
    }
    getRouter() {
        return this.router;
    }
}
exports.GroupLeaderRouter = GroupLeaderRouter;
