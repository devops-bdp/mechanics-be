"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
class SuperAdminController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ==================== USER MANAGEMENT ====================
    async getAllUsers(req, res) {
        try {
            const { role, posisi, search, page = "1", limit = "10", sortBy = "createdAt", sortOrder = "desc", } = req.query;
            // Parse pagination
            const pageNumber = parseInt(page, 10) || 1;
            const limitNumber = parseInt(limit, 10) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            // Validate pagination
            if (pageNumber < 1) {
                res.status(400).json({
                    success: false,
                    message: "Page must be greater than 0",
                });
                return;
            }
            if (limitNumber < 1 || limitNumber > 100) {
                res.status(400).json({
                    success: false,
                    message: "Limit must be between 1 and 100",
                });
                return;
            }
            // Build where clause
            const where = {};
            if (role) {
                const roleValue = Array.isArray(role) ? role[0] : role;
                where.role = roleValue;
            }
            if (posisi) {
                const posisiValue = Array.isArray(posisi) ? posisi[0] : posisi;
                where.posisi = posisiValue;
            }
            // Search filter
            if (search) {
                const searchValue = Array.isArray(search) ? search[0] : search;
                where.OR = [
                    { email: { contains: searchValue, mode: "insensitive" } },
                    { firstName: { contains: searchValue, mode: "insensitive" } },
                    { lastName: { contains: searchValue, mode: "insensitive" } },
                    { nrp: { equals: parseInt(searchValue) || undefined } },
                ];
            }
            // Validate sortBy
            const validSortFields = ["createdAt", "updatedAt", "email", "firstName", "lastName", "nrp"];
            const sortField = validSortFields.includes(sortBy)
                ? sortBy
                : "createdAt";
            const order = sortOrder === "asc" ? "asc" : "desc";
            // Get total count
            const totalCount = await this.prisma.user.count({ where });
            // Get paginated users
            const users = await this.prisma.user.findMany({
                where,
                skip,
                take: limitNumber,
                orderBy: {
                    [sortField]: order,
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
            const totalPages = Math.ceil(totalCount / limitNumber);
            const hasNextPage = pageNumber < totalPages;
            const hasPrevPage = pageNumber > 1;
            res.status(200).json({
                success: true,
                message: "Users retrieved successfully",
                data: users,
                pagination: {
                    currentPage: pageNumber,
                    totalPages,
                    totalCount,
                    limit: limitNumber,
                    hasNextPage,
                    hasPrevPage,
                },
            });
        }
        catch (error) {
            console.error("Get all users error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const userId = Array.isArray(id) ? id[0] : id;
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
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
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: "User retrieved successfully",
                data: user,
            });
        }
        catch (error) {
            console.error("Get user by id error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const userId = Array.isArray(id) ? id[0] : id;
            const userIdFromToken = req.user?.id;
            const { email, firstName, lastName, nrp, role, posisi, phoneNumber, avatar, password, } = req.body;
            // Check if user exists
            const existingUser = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!existingUser) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }
            // Validate role if provided
            if (role) {
                const validRoles = ["SUPERADMIN", "ADMIN", "USERS"];
                if (!validRoles.includes(role)) {
                    res.status(400).json({
                        success: false,
                        message: `Invalid role. Valid roles are: ${validRoles.join(", ")}`,
                    });
                    return;
                }
            }
            // Validate posisi if provided
            if (posisi) {
                const validPosisi = [
                    "MEKANIK",
                    "ELECTRICIAN",
                    "WELDER",
                    "TYREMAN",
                    "GROUP_LEADER_MEKANIK",
                    "GROUP_LEADER_TYRE",
                    "PLANNER",
                    "SUPERVISOR",
                    "DEPT_HEAD",
                    "MANAGEMENT",
                ];
                if (!validPosisi.includes(posisi)) {
                    res.status(400).json({
                        success: false,
                        message: `Invalid posisi. Valid posisi are: ${validPosisi.join(", ")}`,
                    });
                    return;
                }
            }
            // Check if email already exists (if changing email)
            if (email && email !== existingUser.email) {
                const emailExists = await this.prisma.user.findUnique({
                    where: { email },
                });
                if (emailExists) {
                    res.status(409).json({
                        success: false,
                        message: "Email already exists",
                    });
                    return;
                }
            }
            // Check if NRP already exists (if changing NRP)
            if (nrp && nrp !== existingUser.nrp) {
                const nrpExists = await this.prisma.user.findFirst({
                    where: { nrp },
                });
                if (nrpExists) {
                    res.status(409).json({
                        success: false,
                        message: "NRP already exists",
                    });
                    return;
                }
            }
            // Build update data
            const updateData = {};
            if (email !== undefined)
                updateData.email = email;
            if (firstName !== undefined)
                updateData.firstName = firstName;
            if (lastName !== undefined)
                updateData.lastName = lastName;
            if (nrp !== undefined)
                updateData.nrp = nrp;
            if (role !== undefined)
                updateData.role = role;
            if (posisi !== undefined)
                updateData.posisi = posisi;
            if (phoneNumber !== undefined)
                updateData.phoneNumber = phoneNumber;
            if (avatar !== undefined)
                updateData.avatar = avatar;
            // Hash password if provided
            if (password) {
                if (password.length < 6) {
                    res.status(400).json({
                        success: false,
                        message: "Password must be at least 6 characters long",
                    });
                    return;
                }
                const saltRounds = 10;
                updateData.password = await bcrypt_1.default.hash(password, saltRounds);
            }
            // Check if there's anything to update
            if (Object.keys(updateData).length === 0) {
                res.status(400).json({
                    success: false,
                    message: "No fields to update",
                });
                return;
            }
            // Update user
            const updatedUser = await this.prisma.user.update({
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
                message: "User updated successfully",
                data: updatedUser,
            });
        }
        catch (error) {
            console.error("Update user error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const userId = Array.isArray(id) ? id[0] : id;
            const userIdFromToken = req.user?.id;
            // Prevent self-deletion
            if (userId === userIdFromToken) {
                res.status(400).json({
                    success: false,
                    message: "You cannot delete your own account",
                });
                return;
            }
            // Check if user exists
            const existingUser = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!existingUser) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }
            // Delete user
            await this.prisma.user.delete({
                where: { id: userId },
            });
            res.status(200).json({
                success: true,
                message: "User deleted successfully",
            });
        }
        catch (error) {
            console.error("Delete user error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    // ==================== ACTIVITY MANAGEMENT ====================
    async getAllActivities(req, res) {
        try {
            const { status, activityName, unitId, mechanicId, search, page = "1", limit = "10", sortBy = "createdAt", sortOrder = "desc", } = req.query;
            // Parse pagination
            const pageNumber = parseInt(page, 10) || 1;
            const limitNumber = parseInt(limit, 10) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            // Validate pagination
            if (pageNumber < 1) {
                res.status(400).json({
                    success: false,
                    message: "Page must be greater than 0",
                });
                return;
            }
            if (limitNumber < 1 || limitNumber > 100) {
                res.status(400).json({
                    success: false,
                    message: "Limit must be between 1 and 100",
                });
                return;
            }
            // Build where clause
            const where = {};
            if (status) {
                const statusValue = Array.isArray(status) ? status[0] : status;
                where.activityStatus = statusValue;
            }
            if (activityName) {
                const nameValue = Array.isArray(activityName) ? activityName[0] : activityName;
                where.activityName = nameValue;
            }
            if (unitId) {
                const unitValue = Array.isArray(unitId) ? unitId[0] : unitId;
                where.unitId = unitValue;
            }
            if (mechanicId) {
                const mechanicValue = Array.isArray(mechanicId) ? mechanicId[0] : mechanicId;
                where.mechanics = {
                    some: {
                        mechanicId: mechanicValue,
                    },
                };
            }
            // Search filter
            if (search) {
                const searchValue = Array.isArray(search) ? search[0] : search;
                where.OR = [
                    {
                        description: {
                            contains: searchValue,
                            mode: "insensitive",
                        },
                    },
                    {
                        remarks: {
                            contains: searchValue,
                            mode: "insensitive",
                        },
                    },
                ];
            }
            // Validate sortBy
            const validSortFields = [
                "createdAt",
                "updatedAt",
                "estimatedStart",
                "activityStatus",
            ];
            const sortField = validSortFields.includes(sortBy)
                ? sortBy
                : "createdAt";
            const order = sortOrder === "asc" ? "asc" : "desc";
            // Get total count
            const totalCount = await this.prisma.mechanicActivity.count({ where });
            // Get paginated activities
            const activities = await this.prisma.mechanicActivity.findMany({
                where,
                skip,
                take: limitNumber,
                orderBy: {
                    [sortField]: order,
                },
                include: {
                    unit: {
                        select: {
                            id: true,
                            unitCode: true,
                            unitType: true,
                            unitBrand: true,
                            unitDescription: true,
                        },
                    },
                    mechanics: {
                        include: {
                            mechanic: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    nrp: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });
            const totalPages = Math.ceil(totalCount / limitNumber);
            const hasNextPage = pageNumber < totalPages;
            const hasPrevPage = pageNumber > 1;
            res.status(200).json({
                success: true,
                message: "Activities retrieved successfully",
                data: activities,
                pagination: {
                    currentPage: pageNumber,
                    totalPages,
                    totalCount,
                    limit: limitNumber,
                    hasNextPage,
                    hasPrevPage,
                },
            });
        }
        catch (error) {
            console.error("Get all activities error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async deleteActivity(req, res) {
        try {
            const { id } = req.params;
            const activityId = Array.isArray(id) ? id[0] : id;
            // Check if activity exists
            const existingActivity = await this.prisma.mechanicActivity.findUnique({
                where: { id: activityId },
                include: {
                    mechanics: {
                        include: {
                            tasks: true,
                        },
                    },
                },
            });
            if (!existingActivity) {
                res.status(404).json({
                    success: false,
                    message: "Activity not found",
                });
                return;
            }
            // Count related records that will be deleted (for logging)
            const mechanicsCount = existingActivity.mechanics.length;
            const tasksCount = existingActivity.mechanics.reduce((sum, mechanic) => sum + mechanic.tasks.length, 0);
            // Hard delete activity (cascade will automatically delete):
            // - All ActivityMechanic records (onDelete: Cascade)
            // - All Task records (onDelete: Cascade from ActivityMechanic)
            await this.prisma.mechanicActivity.delete({
                where: { id: activityId },
            });
            console.log(`Activity ${activityId} deleted by SUPERADMIN. Removed ${mechanicsCount} mechanic assignments and ${tasksCount} tasks.`);
            res.status(200).json({
                success: true,
                message: "Activity deleted successfully",
                data: {
                    deletedActivityId: activityId,
                    deletedMechanicsCount: mechanicsCount,
                    deletedTasksCount: tasksCount,
                },
            });
        }
        catch (error) {
            console.error("Delete activity error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    // ==================== WORK TIME MANAGEMENT ====================
    async getAllWorkTimes(req, res) {
        try {
            const { mechanicId, startDate, endDate, page = "1", limit = "10", sortBy = "date", sortOrder = "desc", } = req.query;
            // Parse pagination
            const pageNumber = parseInt(page, 10) || 1;
            const limitNumber = parseInt(limit, 10) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            // Validate pagination
            if (pageNumber < 1) {
                res.status(400).json({
                    success: false,
                    message: "Page must be greater than 0",
                });
                return;
            }
            if (limitNumber < 1 || limitNumber > 100) {
                res.status(400).json({
                    success: false,
                    message: "Limit must be between 1 and 100",
                });
                return;
            }
            // Build where clause
            const where = {};
            if (mechanicId) {
                const mechanicValue = Array.isArray(mechanicId) ? mechanicId[0] : mechanicId;
                where.mechanicId = mechanicValue;
            }
            // Date range filter
            if (startDate || endDate) {
                where.date = {};
                if (startDate) {
                    const start = new Date(startDate);
                    where.date.gte = start;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    where.date.lte = end;
                }
            }
            // Validate sortBy
            const validSortFields = ["date", "createdAt", "updatedAt", "totalWorkTime"];
            const sortField = validSortFields.includes(sortBy)
                ? sortBy
                : "date";
            const order = sortOrder === "asc" ? "asc" : "desc";
            // Get total count
            const totalCount = await this.prisma.mechanicWorkTime.count({ where });
            // Get paginated work times
            const workTimes = await this.prisma.mechanicWorkTime.findMany({
                where,
                skip,
                take: limitNumber,
                orderBy: {
                    [sortField]: order,
                },
                include: {
                    mechanic: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            nrp: true,
                            email: true,
                        },
                    },
                },
            });
            const totalPages = Math.ceil(totalCount / limitNumber);
            const hasNextPage = pageNumber < totalPages;
            const hasPrevPage = pageNumber > 1;
            res.status(200).json({
                success: true,
                message: "Work times retrieved successfully",
                data: workTimes,
                pagination: {
                    currentPage: pageNumber,
                    totalPages,
                    totalCount,
                    limit: limitNumber,
                    hasNextPage,
                    hasPrevPage,
                },
            });
        }
        catch (error) {
            console.error("Get all work times error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async deleteWorkTime(req, res) {
        try {
            const { id } = req.params;
            const workTimeId = Array.isArray(id) ? id[0] : id;
            // Check if work time exists
            const existingWorkTime = await this.prisma.mechanicWorkTime.findUnique({
                where: { id: workTimeId },
            });
            if (!existingWorkTime) {
                res.status(404).json({
                    success: false,
                    message: "Work time not found",
                });
                return;
            }
            // Delete work time
            await this.prisma.mechanicWorkTime.delete({
                where: { id: workTimeId },
            });
            res.status(200).json({
                success: true,
                message: "Work time deleted successfully",
            });
        }
        catch (error) {
            console.error("Delete work time error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    // ==================== DASHBOARD / STATISTICS ====================
    async getDashboardStats(req, res) {
        try {
            // Get counts
            const [totalUsers, totalUnits, totalActivities, totalWorkTimes, activeActivities, completedActivities, pendingActivities,] = await Promise.all([
                this.prisma.user.count(),
                this.prisma.unit.count(),
                this.prisma.mechanicActivity.count(),
                this.prisma.mechanicWorkTime.count(),
                this.prisma.mechanicActivity.count({
                    where: { activityStatus: "IN_PROGRESS" },
                }),
                this.prisma.mechanicActivity.count({
                    where: { activityStatus: "COMPLETED" },
                }),
                this.prisma.mechanicActivity.count({
                    where: { activityStatus: "PENDING" },
                }),
            ]);
            // Get recent activities
            const recentActivities = await this.prisma.mechanicActivity.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    unit: {
                        select: {
                            id: true,
                            unitCode: true,
                            unitType: true,
                            unitBrand: true,
                        },
                    },
                    mechanics: {
                        include: {
                            mechanic: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    nrp: true,
                                },
                            },
                        },
                    },
                },
            });
            res.status(200).json({
                success: true,
                message: "Dashboard statistics retrieved successfully",
                data: {
                    counts: {
                        totalUsers,
                        totalUnits,
                        totalActivities,
                        totalWorkTimes,
                        activeActivities,
                        completedActivities,
                        pendingActivities,
                    },
                    recentActivities,
                },
            });
        }
        catch (error) {
            console.error("Get dashboard stats error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
}
exports.SuperAdminController = SuperAdminController;
