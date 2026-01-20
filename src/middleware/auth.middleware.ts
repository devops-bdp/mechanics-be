import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/database";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        nrp: number;
        posisi: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "No token provided or invalid format",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      res.status(401).json({
        success: false,
        message: "No token provided",
      });
      return;
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not defined in environment variables");
      res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      email: string;
      role: string;
      nrp: number;
      iat?: number;
      exp?: number;
    };

    // Check if user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        nrp: true,
        posisi: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found or token invalid",
      });
      return;
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      nrp: user.nrp,
      posisi: user.posisi,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid token",
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Token expired",
      });
      return;
    }

    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

/**
 * Middleware to check if user has required role
 * @param roles - Array of allowed roles
 */
export const authorize =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
      return;
    }

    next();
  };

/**
 * Maps a position to its equivalent access position
 */
function getEquivalentPosisi(posisi: string): string {
  const posisiMap: Record<string, string> = {
    // ELECTRICIAN, WELDER, TYREMAN have same access as MEKANIK
    ELECTRICIAN: 'MEKANIK',
    WELDER: 'MEKANIK',
    TYREMAN: 'MEKANIK',
    // GROUP_LEADER_TYRE has same access as GROUP_LEADER_MEKANIK
    GROUP_LEADER_TYRE: 'GROUP_LEADER_MEKANIK',
    // SUPERVISOR has same access as PLANNER
    SUPERVISOR: 'PLANNER',
    // DEPT_HEAD and MANAGEMENT have same access as SUPERADMIN (but may be read-only if role is USERS)
    DEPT_HEAD: 'SUPERADMIN',
    MANAGEMENT: 'SUPERADMIN',
  };

  return posisiMap[posisi] || posisi;
}

/**
 * Gets all equivalent positions for a given position
 */
function getEquivalentPosisiArray(posisi: string): string[] {
  const equivalent = getEquivalentPosisi(posisi);
  return equivalent !== posisi ? [posisi, equivalent] : [posisi];
}

/**
 * Checks if a user has read-only access
 * DEPT_HEAD and MANAGEMENT with Role USERS are read-only
 */
function isReadOnly(role: string, posisi: string): boolean {
  const readOnlyPositions = ['DEPT_HEAD', 'MANAGEMENT'];
  return readOnlyPositions.includes(posisi) && role === 'USERS';
}

/**
 * Middleware to check if user has required posisi (including equivalent positions)
 * @param posisis - Array of allowed posisis
 */
export const authorizePosisi =
  (...posisis: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const equivalentPositions = getEquivalentPosisiArray(req.user.posisi);
    const hasAccess = equivalentPositions.some(pos => posisis.includes(pos));

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
      return;
    }

    next();
  };

/**
 * Middleware to check if user can write (not read-only)
 */
export const authorizeWrite =
  () =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (isReadOnly(req.user.role, req.user.posisi)) {
      res.status(403).json({
        success: false,
        message: "Read-only access. You do not have permission to modify data.",
      });
      return;
    }

    next();
  };
