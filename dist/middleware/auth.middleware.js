"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizePosisi = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../lib/database");
/**
 * Middleware to verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Check if user still exists in database
        const user = await database_1.prisma.user.findUnique({
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
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: "Invalid token",
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
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
exports.authenticate = authenticate;
/**
 * Middleware to check if user has required role
 * @param roles - Array of allowed roles
 */
const authorize = (...roles) => (req, res, next) => {
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
exports.authorize = authorize;
/**
 * Middleware to check if user has required posisi
 * @param posisis - Array of allowed posisis
 */
const authorizePosisi = (...posisis) => (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: "Authentication required",
        });
        return;
    }
    if (!posisis.includes(req.user.posisi)) {
        res.status(403).json({
            success: false,
            message: "Insufficient permissions",
        });
        return;
    }
    next();
};
exports.authorizePosisi = authorizePosisi;
