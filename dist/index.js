"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const auth_router_1 = require("./routes/auth.router");
const unit_router_1 = require("./routes/unit.router");
const planner_router_1 = require("./routes/planner.router");
const mechanics_router_1 = require("./routes/mechanics.router");
const superadmin_router_1 = require("./routes/superadmin.router");
const supervisor_router_1 = require("./routes/supervisor.router");
const groupleader_router_1 = require("./routes/groupleader.router");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Routes
const authRouter = new auth_router_1.AuthRouter();
const unitRouter = new unit_router_1.UnitRouter();
const plannerRouter = new planner_router_1.PlannerRouter();
const mechanicsRouter = new mechanics_router_1.MechanicsRouter();
const superAdminRouter = new superadmin_router_1.SuperAdminRouter();
const supervisorRouter = new supervisor_router_1.SupervisorRouter();
const groupLeaderRouter = new groupleader_router_1.GroupLeaderRouter();
app.use("/api/auth", authRouter.getRouter());
app.use("/api/units", unitRouter.getRouter());
app.use("/api/planner", plannerRouter.getRouter());
app.use("/api/mechanics", mechanicsRouter.getRouter());
app.use("/api/superadmin", superAdminRouter.getRouter());
app.use("/api/supervisor", supervisorRouter.getRouter());
app.use("/api/groupleader", groupLeaderRouter.getRouter());
// Error handling for JSON parsing and other errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON format",
            error: process.env.NODE_ENV === "development" ? err.message : undefined,
        });
    }
    if (err) {
        console.error("Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? err.message : undefined,
        });
    }
    next();
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.path,
    });
});
// Local development
const PORT = process.env.PORT || 8000;
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
// CRITICAL: Export for Vercel
exports.default = app;
