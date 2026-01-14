import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/database";
import { Role, Posision } from "@prisma/client";

export class AuthController {
  async createAccount(req: Request, res: Response): Promise<void> {
    try {
      let {
        email,
        password,
        firstName,
        lastName,
        nrp,
        role = Role.USERS,
        posisi = Posision.MEKANIK,
        phoneNumber,
        avatar,
      } = req.body;

      // Normalize role (handle SUPER_ADMIN -> SUPERADMIN)
      if (typeof role === "string" && role.toUpperCase() === "SUPER_ADMIN") {
        role = Role.SUPERADMIN;
      } else if (typeof role === "string") {
        role = role.toUpperCase() as Role;
      }

      // Validation
      if (!email || !password || !firstName || !lastName || !nrp) {
        res.status(400).json({
          success: false,
          message:
            "Missing required fields: email, password, firstName, lastName, nrp",
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
        return;
      }

      // Validate password strength (minimum 6 characters)
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
        return;
      }

      // Validate NRP (must be positive number)
      if (nrp <= 0 || !Number.isInteger(nrp)) {
        res.status(400).json({
          success: false,
          message: "NRP must be a positive integer",
        });
        return;
      }

      // Validate role
      const validRoles = Object.values(Role);
      if (role && !validRoles.includes(role as Role)) {
        res.status(400).json({
          success: false,
          message: `Invalid role. Valid roles are: ${validRoles.join(", ")}`,
        });
        return;
      }

      // Validate posisi
      const validPosisi = Object.values(Posision);
      if (posisi && !validPosisi.includes(posisi as Posision)) {
        res.status(400).json({
          success: false,
          message: `Invalid posisi. Valid posisi are: ${validPosisi.join(
            ", "
          )}`,
        });
        return;
      }

      // Convert phoneNumber to string if provided as number
      const phoneNumberStr = phoneNumber ? String(phoneNumber) : undefined;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: "User with this email already exists",
        });
        return;
      }

      // Check if NRP already exists
      const existingNrp = await prisma.user.findFirst({
        where: { nrp },
      });

      if (existingNrp) {
        res.status(409).json({
          success: false,
          message: "User with this NRP already exists",
        });
        return;
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          nrp,
          role: role as Role,
          posisi: posisi as Posision,
          phoneNumber: phoneNumberStr,
          avatar,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          nrp: true,
          role: true,
          posisi: true,
          avatar: true,
          phoneNumber: true,
          createdAt: true,
          updatedAt: true,
          password: false,
        },
      });

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: user,
      });
    } catch (error) {
      console.error("Create account error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
        return;
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error("JWT_SECRET is not defined in environment variables");
        res.status(500).json({
          success: false,
          message: "Server configuration error",
        });
        return;
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          nrp: user.nrp,
          posisi: user.posisi,
        },
        jwtSecret,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        } as jwt.SignOptions
      );

      // Return user data (without password) and token
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      // User ID from authenticated token
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const { firstName, lastName, phoneNumber, avatar, posisi } = req.body;

      // Validate posisi if provided
      if (posisi) {
        const validPosisi = Object.values(Posision);
        if (!validPosisi.includes(posisi as Posision)) {
          res.status(400).json({
            success: false,
            message: `Invalid posisi. Valid posisi are: ${validPosisi.join(
              ", "
            )}`,
          });
          return;
        }
      }

      // Build update data object (only include provided fields)
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (posisi !== undefined) updateData.posisi = posisi as Posision;

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          message: "No fields to update",
        });
        return;
      }

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          nrp: true,
          role: true,
          posisi: true,
          avatar: true,
          phoneNumber: true,
          createdAt: true,
          updatedAt: true,
          password: false,
        },
      });

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      // User ID from authenticated token
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const { oldPassword, newPassword } = req.body;

      // Validation
      if (!oldPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: "Old password and new password are required",
        });
        return;
      }

      // Validate new password strength (minimum 6 characters)
      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long",
        });
        return;
      }

      // Check if old and new password are the same
      if (oldPassword === newPassword) {
        res.status(400).json({
          success: false,
          message: "New password must be different from old password",
        });
        return;
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      // Verify old password
      const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        user.password
      );

      if (!isOldPasswordValid) {
        res.status(401).json({
          success: false,
          message: "Old password is incorrect",
        });
        return;
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
        },
      });

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  async getAllRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = Object.values(Role);

      res.status(200).json({
        success: true,
        message: "Roles retrieved successfully",
        data: roles,
      });
    } catch (error) {
      console.error("Get all roles error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }
}
