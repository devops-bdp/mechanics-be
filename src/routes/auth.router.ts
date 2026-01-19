import { Router } from "express";
import { AuthController } from "../controllers/auth-controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { uploadProfilePicture } from "../middleware/upload.middleware";

export class AuthRouter {
  private router: Router;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Login - public route
    this.router.post("/login", (req, res) =>
      this.authController.login(req, res)
    );

    // Create account - protected route, only ADMIN and SUPERADMIN can access
    this.router.post(
      "/create-account",
      authenticate,
      authorize("ADMIN", "SUPERADMIN"),
      (req, res) => this.authController.createAccount(req, res)
    );

    // Update profile - protected route, user can update their own profile
    this.router.put("/profile", authenticate, (req, res) =>
      this.authController.updateProfile(req, res)
    );

    // Upload profile picture - protected route, user can upload their own profile picture
    this.router.post(
      "/profile/picture",
      authenticate,
      uploadProfilePicture.single("profilePicture"),
      (req, res) => this.authController.uploadProfilePicture(req, res)
    );

    // Change password - protected route, user can change their own password
    this.router.put("/change-password", authenticate, (req, res) =>
      this.authController.changePassword(req, res)
    );

    // Get all roles - protected route, requires authentication
    this.router.get("/roles", authenticate, (req, res) =>
      this.authController.getAllRoles(req, res)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
