"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MechanicsRouter = void 0;
const express_1 = require("express");
const mechanics_controller_1 = require("../controllers/mechanics-controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../lib/database");
class MechanicsRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.mechanicsController = new mechanics_controller_1.MechanicsController(database_1.prisma);
        this.setupRoutes();
    }
    setupRoutes() {
        // Create work time - protected route, mechanics can create their own work time
        this.router.post("/work-times", auth_middleware_1.authenticate, (req, res) => this.mechanicsController.createWorkTime(req, res));
        // Get all work times - protected route, mechanics see their own, admin see all
        this.router.get("/work-times", auth_middleware_1.authenticate, (req, res) => this.mechanicsController.getAllWorkTimes(req, res));
        // Get work time by id - protected route
        this.router.get("/work-times/:id", auth_middleware_1.authenticate, (req, res) => this.mechanicsController.getWorkTimeById(req, res));
        // Update work time - protected route, mechanics can update their own
        this.router.put("/work-times/:id", auth_middleware_1.authenticate, (req, res) => this.mechanicsController.updateWorkTime(req, res));
        // Delete work time - protected route, mechanics can delete their own
        this.router.delete("/work-times/:id", auth_middleware_1.authenticate, (req, res) => this.mechanicsController.deleteWorkTime(req, res));
        // Get my assigned activities - protected route
        this.router.get("/activities", auth_middleware_1.authenticate, (req, res) => this.mechanicsController.getMyActivities(req, res));
        // Start task - protected route (MUST be before /activities/:activityId/start to avoid route conflict)
        this.router.post("/activities/:activityId/tasks/start", auth_middleware_1.authenticate, (req, res) => this.mechanicsController.startTask(req, res));
        // Stop task - protected route (MUST be before /activities/:activityId/stop to avoid route conflict)
        this.router.post("/activities/:activityId/tasks/stop", auth_middleware_1.authenticate, (req, res) => this.mechanicsController.stopTask(req, res));
        // Start activity - protected route
        this.router.post("/activities/:activityId/start", auth_middleware_1.authenticate, (req, res) => this.mechanicsController.startActivity(req, res));
        // Pause activity - protected route
        this.router.post("/activities/:activityId/pause", auth_middleware_1.authenticate, (req, res) => this.mechanicsController.pauseActivity(req, res));
        // Resume activity - protected route
        this.router.post("/activities/:activityId/resume", auth_middleware_1.authenticate, (req, res) => this.mechanicsController.resumeActivity(req, res));
        // Stop activity - protected route
        this.router.post("/activities/:activityId/stop", auth_middleware_1.authenticate, (req, res) => this.mechanicsController.stopActivity(req, res));
    }
    getRouter() {
        return this.router;
    }
}
exports.MechanicsRouter = MechanicsRouter;
