"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth-controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
class AuthRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.authController = new auth_controller_1.AuthController();
        this.setupRoutes();
    }
    setupRoutes() {
        // Login - public route
        this.router.post("/login", (req, res) => this.authController.login(req, res));
        // Create account - protected route, only ADMIN and SUPERADMIN can access
        this.router.post("/create-account", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("ADMIN", "SUPERADMIN"), (req, res) => this.authController.createAccount(req, res));
        // Update profile - protected route, user can update their own profile
        this.router.put("/profile", auth_middleware_1.authenticate, (req, res) => this.authController.updateProfile(req, res));
        // Upload profile picture - protected route, user can upload their own profile picture
        this.router.post("/profile/picture", auth_middleware_1.authenticate, upload_middleware_1.uploadProfilePicture.single("profilePicture"), (req, res) => this.authController.uploadProfilePicture(req, res));
        // Change password - protected route, user can change their own password
        this.router.put("/change-password", auth_middleware_1.authenticate, (req, res) => this.authController.changePassword(req, res));
        // Get all roles - protected route, requires authentication
        this.router.get("/roles", auth_middleware_1.authenticate, (req, res) => this.authController.getAllRoles(req, res));
    }
    getRouter() {
        return this.router;
    }
}
exports.AuthRouter = AuthRouter;
