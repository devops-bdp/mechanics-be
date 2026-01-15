"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupLeaderController = void 0;
const client_1 = require("@prisma/client");
class GroupLeaderController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // Get task sequence for each activity type
    getTaskSequence(activityName) {
        const sequences = {
            PERIODIC_SERVICE: [
                { taskName: client_1.TaskName.PREPARING_PART, order: 1 },
                { taskName: client_1.TaskName.PREPARING_TOOLS, order: 2 },
                { taskName: client_1.TaskName.WASHING_UNIT, order: 3 },
                { taskName: client_1.TaskName.PRE_INSPECTION, order: 4 },
                { taskName: client_1.TaskName.PELAKSANAAN_PS, order: 5 },
                { taskName: client_1.TaskName.PELAKSANAAN_BACKLOG, order: 6 },
                { taskName: client_1.TaskName.PAP, order: 7 },
                { taskName: client_1.TaskName.PPM, order: 8 },
                { taskName: client_1.TaskName.REPORTING, order: 9 },
                { taskName: client_1.TaskName.HOUSEKEEPING, order: 10 },
            ],
            TROUBLESHOOTING: [
                { taskName: client_1.TaskName.PREPARING_PART, order: 1 },
                { taskName: client_1.TaskName.PREPARING_TOOLS, order: 2 },
                { taskName: client_1.TaskName.TRAVELING, order: 3 },
                { taskName: client_1.TaskName.ON_PROCESS, order: 4 },
                { taskName: client_1.TaskName.FINAL_CHECK, order: 5 },
                { taskName: client_1.TaskName.REPORTING, order: 6 },
            ],
            PERIODIC_INSPECTION: [
                { taskName: client_1.TaskName.PREPARING_TOOLS, order: 1 },
                { taskName: client_1.TaskName.ON_PROCESS, order: 2 },
                { taskName: client_1.TaskName.FINAL_CHECK_AND_GROUND_TEST, order: 3 },
                { taskName: client_1.TaskName.REPORTING, order: 4 },
                { taskName: client_1.TaskName.HOUSEKEEPING, order: 5 },
            ],
            REPAIR_AND_ADJUSTMENT: [
                { taskName: client_1.TaskName.PREPARING_TOOLS, order: 1 },
                { taskName: client_1.TaskName.ON_PROCESS, order: 2 },
                { taskName: client_1.TaskName.FINAL_CHECK, order: 3 },
                { taskName: client_1.TaskName.REPORTING, order: 4 },
            ],
            GENERAL_REPAIR: [
                { taskName: client_1.TaskName.PREPARING_PART, order: 1 },
                { taskName: client_1.TaskName.PREPARING_TOOLS, order: 2 },
                { taskName: client_1.TaskName.ON_PROCESS, order: 3 },
                { taskName: client_1.TaskName.FINAL_CHECK, order: 4 },
                { taskName: client_1.TaskName.REPORTING, order: 5 },
                { taskName: client_1.TaskName.HOUSEKEEPING, order: 6 },
            ],
            PERIODIC_INSPECTION_TYRE: [
                { taskName: client_1.TaskName.PREPARING_TOOLS, order: 1 },
                { taskName: client_1.TaskName.ON_PROCESS, order: 2 },
                { taskName: client_1.TaskName.FINAL_CHECK_AND_GROUND_TEST, order: 3 },
                { taskName: client_1.TaskName.REPORTING, order: 4 },
                { taskName: client_1.TaskName.HOUSEKEEPING, order: 5 },
            ],
            PERIODIC_SERVICE_TYRE: [
                { taskName: client_1.TaskName.PREPARING_PARTS, order: 1 },
                { taskName: client_1.TaskName.PREPARING_TOOLS, order: 2 },
                { taskName: client_1.TaskName.WASHING_UNITS, order: 3 },
                { taskName: client_1.TaskName.PRE_INSPECTION, order: 4 },
                { taskName: client_1.TaskName.REMOVE_INSTALL_TYRE, order: 5 },
                { taskName: client_1.TaskName.REPORTING, order: 6 },
                { taskName: client_1.TaskName.HOUSEKEEPING, order: 7 },
            ],
            RETORQUE_TYRE: [
                { taskName: client_1.TaskName.PREPARING_TOOLS, order: 1 },
                { taskName: client_1.TaskName.RETORQUE, order: 2 },
                { taskName: client_1.TaskName.REPORTING, order: 3 },
            ],
            REPAIR_TYRE: [
                { taskName: client_1.TaskName.PREPARING_TYRE_AND_MATERIAL, order: 1 },
                { taskName: client_1.TaskName.PREPARING_TOOLS, order: 2 },
                { taskName: client_1.TaskName.ON_PROCESS, order: 3 },
                { taskName: client_1.TaskName.FINAL_CHECK, order: 4 },
                { taskName: client_1.TaskName.HOUSEKEEPING, order: 5 },
            ],
            TROUBLESHOOTING_TYRE: [
                { taskName: client_1.TaskName.PREPARING_PART, order: 1 },
                { taskName: client_1.TaskName.PREPARING_TOOLS, order: 2 },
                { taskName: client_1.TaskName.TRAVELING, order: 3 },
                { taskName: client_1.TaskName.ON_PROCESS, order: 4 },
                { taskName: client_1.TaskName.FINAL_CHECK, order: 5 },
                { taskName: client_1.TaskName.REPORTING, order: 6 },
            ],
        };
        return sequences[activityName] || [];
    }
    // Check if activity type supports tasks
    supportsTasks(activityName) {
        const supportedActivities = [
            "PERIODIC_SERVICE",
            "TROUBLESHOOTING",
            "PERIODIC_INSPECTION",
            "REPAIR_AND_ADJUSTMENT",
            "GENERAL_REPAIR",
            "PERIODIC_INSPECTION_TYRE",
            "PERIODIC_SERVICE_TYRE",
            "RETORQUE_TYRE",
            "REPAIR_TYRE",
            "TROUBLESHOOTING_TYRE",
        ];
        return supportedActivities.includes(activityName);
    }
    async assignMechanics(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
            const { id } = req.params;
            const activityId = Array.isArray(id) ? id[0] : id;
            const { mechanicIds } = req.body;
            // Validation
            if (!mechanicIds) {
                res.status(400).json({
                    success: false,
                    message: "Missing required field: mechanicIds (array)",
                });
                return;
            }
            // Validate mechanicIds is an array
            if (!Array.isArray(mechanicIds)) {
                res.status(400).json({
                    success: false,
                    message: "mechanicIds must be an array",
                });
                return;
            }
            // Validate mechanicIds count (1-7)
            if (mechanicIds.length < 1 || mechanicIds.length > 7) {
                res.status(400).json({
                    success: false,
                    message: "You must assign between 1 and 7 mechanics",
                });
                return;
            }
            // Validate unique mechanicIds
            const uniqueMechanicIds = [...new Set(mechanicIds)];
            if (uniqueMechanicIds.length !== mechanicIds.length) {
                res.status(400).json({
                    success: false,
                    message: "Duplicate mechanic IDs are not allowed",
                });
                return;
            }
            // Check if activity exists
            const activity = await this.prisma.mechanicActivity.findUnique({
                where: { id: activityId },
            });
            if (!activity) {
                res.status(404).json({
                    success: false,
                    message: "Activity not found",
                });
                return;
            }
            // Check if mechanics already assigned
            const existingAssignments = await this.prisma.activityMechanic.findMany({
                where: { activityId },
            });
            if (existingAssignments.length > 0) {
                res.status(400).json({
                    success: false,
                    message: "Mechanics are already assigned to this activity. Please remove existing assignments first.",
                });
                return;
            }
            // Check if all mechanics exist and have valid posisi
            const mechanics = await this.prisma.user.findMany({
                where: {
                    id: {
                        in: mechanicIds,
                    },
                },
            });
            if (mechanics.length !== mechanicIds.length) {
                res.status(404).json({
                    success: false,
                    message: "One or more mechanics not found",
                });
                return;
            }
            // Validate mechanics posisi (MEKANIK, ELECTRICIAN, WELDER, TYREMAN)
            const validPosisis = ["MEKANIK", "ELECTRICIAN", "WELDER", "TYREMAN"];
            const invalidMechanics = mechanics.filter((m) => !validPosisis.includes(m.posisi));
            if (invalidMechanics.length > 0) {
                res.status(400).json({
                    success: false,
                    message: `Invalid posisi. Only MEKANIK, ELECTRICIAN, WELDER, and TYREMAN can be assigned.`,
                });
                return;
            }
            // Check if any mechanic has unfinished activities (not COMPLETED)
            const unfinishedActivities = await this.prisma.activityMechanic.findMany({
                where: {
                    mechanicId: {
                        in: mechanicIds,
                    },
                    status: {
                        not: "COMPLETED",
                    },
                },
                include: {
                    mechanic: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    activity: {
                        include: {
                            unit: {
                                select: {
                                    unitCode: true,
                                },
                            },
                        },
                    },
                },
            });
            if (unfinishedActivities.length > 0) {
                const mechanicsWithUnfinished = unfinishedActivities.map((ua) => {
                    const mechanic = mechanics.find((m) => m.id === ua.mechanicId);
                    return {
                        name: mechanic ? `${mechanic.firstName} ${mechanic.lastName}` : "Unknown",
                        activity: ua.activity.unit.unitCode,
                        status: ua.status,
                    };
                });
                res.status(400).json({
                    success: false,
                    message: "Cannot assign mechanics with unfinished activities",
                    details: mechanicsWithUnfinished.map((m) => `${m.name} has unfinished activity ${m.activity} (Status: ${m.status})`),
                });
                return;
            }
            // Get task sequence if activity supports tasks
            const taskSequence = this.supportsTasks(activity.activityName)
                ? this.getTaskSequence(activity.activityName)
                : [];
            // Create assignments with tasks using update with nested create
            const updatedActivity = await this.prisma.mechanicActivity.update({
                where: { id: activityId },
                data: {
                    mechanics: {
                        create: mechanicIds.map((mechanicId) => ({
                            mechanicId,
                            status: "PENDING",
                            // Create tasks for each mechanic if activity supports tasks
                            ...(taskSequence.length > 0 && {
                                tasks: {
                                    create: taskSequence.map((task) => ({
                                        taskName: task.taskName,
                                        order: task.order,
                                    })),
                                },
                            }),
                        })),
                    },
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
                            tasks: {
                                orderBy: {
                                    order: "asc",
                                },
                            },
                        },
                    },
                },
            });
            res.status(200).json({
                success: true,
                message: "Mechanics assigned successfully",
                data: updatedActivity,
            });
        }
        catch (error) {
            console.error("Assign mechanics error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async getMechanics(req, res) {
        try {
            // Get all users with MEKANIK, ELECTRICIAN, WELDER, or TYREMAN posisi
            const allMechanics = await this.prisma.user.findMany({
                where: {
                    posisi: {
                        in: ["MEKANIK", "ELECTRICIAN", "WELDER", "TYREMAN"],
                    },
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    nrp: true,
                    phoneNumber: true,
                    posisi: true,
                },
                orderBy: {
                    firstName: "asc",
                },
            });
            // Get mechanics with unfinished activities (not COMPLETED)
            const unfinishedAssignments = await this.prisma.activityMechanic.findMany({
                where: {
                    status: {
                        not: "COMPLETED",
                    },
                },
                select: {
                    mechanicId: true,
                },
            });
            const busyMechanicIds = new Set(unfinishedAssignments.map((ua) => ua.mechanicId));
            // Filter out mechanics with unfinished activities
            const availableMechanics = allMechanics.filter((mechanic) => !busyMechanicIds.has(mechanic.id));
            res.status(200).json({
                success: true,
                message: "Mechanics retrieved successfully",
                data: availableMechanics,
            });
        }
        catch (error) {
            console.error("Get mechanics error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    // Helper method to format duration
    formatDuration(hours, minutes, seconds, isActive = false) {
        const parts = [];
        if (hours > 0)
            parts.push(`${hours}h`);
        if (minutes > 0)
            parts.push(`${minutes}m`);
        if (seconds > 0 || parts.length === 0)
            parts.push(`${seconds}s`);
        return parts.join(" ") + (isActive ? " (active)" : "");
    }
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
                            tasks: {
                                orderBy: {
                                    order: "asc",
                                },
                            },
                        },
                    },
                },
            });
            // Calculate task durations and format response
            const activitiesWithTaskTime = activities.map((activity) => {
                const mechanicsWithTaskTime = activity.mechanics.map((mechanic) => {
                    const tasksWithDuration = mechanic.tasks.map((task) => {
                        let durationSeconds = 0;
                        let durationFormatted = "0s";
                        let isActive = false;
                        if (task.startedAt && task.stoppedAt) {
                            // Task completed - calculate duration
                            durationSeconds = Math.floor((task.stoppedAt.getTime() - task.startedAt.getTime()) / 1000);
                            const hours = Math.floor(durationSeconds / 3600);
                            const minutes = Math.floor((durationSeconds % 3600) / 60);
                            const seconds = durationSeconds % 60;
                            durationFormatted = this.formatDuration(hours, minutes, seconds);
                        }
                        else if (task.startedAt && !task.stoppedAt) {
                            // Task in progress - calculate current duration
                            const now = new Date();
                            durationSeconds = Math.floor((now.getTime() - task.startedAt.getTime()) / 1000);
                            const hours = Math.floor(durationSeconds / 3600);
                            const minutes = Math.floor((durationSeconds % 3600) / 60);
                            const seconds = durationSeconds % 60;
                            durationFormatted = this.formatDuration(hours, minutes, seconds, true);
                            isActive = true;
                        }
                        // Convert to minutes for backward compatibility
                        const durationMinutes = Math.floor(durationSeconds / 60);
                        return {
                            ...task,
                            durationMinutes,
                            durationFormatted,
                            isActive,
                        };
                    });
                    // Calculate total work time for this mechanic
                    const totalTaskTimeSeconds = tasksWithDuration.reduce((sum, task) => {
                        // Calculate seconds from durationMinutes
                        return sum + (task.durationMinutes * 60);
                    }, 0);
                    const totalHours = Math.floor(totalTaskTimeSeconds / 3600);
                    const totalMinutes = Math.floor((totalTaskTimeSeconds % 3600) / 60);
                    const totalSeconds = totalTaskTimeSeconds % 60;
                    const totalTimeFormatted = this.formatDuration(totalHours, totalMinutes, totalSeconds);
                    const totalTaskTimeMinutes = Math.floor(totalTaskTimeSeconds / 60);
                    return {
                        ...mechanic,
                        tasks: tasksWithDuration,
                        totalTaskTimeMinutes: totalTaskTimeMinutes,
                        totalTaskTimeFormatted: totalTimeFormatted,
                    };
                });
                return {
                    ...activity,
                    mechanics: mechanicsWithTaskTime,
                };
            });
            const totalPages = Math.ceil(totalCount / limitNumber);
            const hasNextPage = pageNumber < totalPages;
            const hasPrevPage = pageNumber > 1;
            res.status(200).json({
                success: true,
                message: "Activities retrieved successfully",
                data: activitiesWithTaskTime,
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
    async getActivityById(req, res) {
        try {
            const { id } = req.params;
            const activityId = Array.isArray(id) ? id[0] : id;
            const activity = await this.prisma.mechanicActivity.findUnique({
                where: { id: activityId },
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
                            tasks: {
                                orderBy: {
                                    order: "asc",
                                },
                            },
                        },
                    },
                },
            });
            if (!activity) {
                res.status(404).json({
                    success: false,
                    message: "Activity not found",
                });
                return;
            }
            // Calculate task durations and format response
            const mechanicsWithTaskTime = activity.mechanics.map((mechanic) => {
                const tasksWithDuration = mechanic.tasks.map((task) => {
                    let durationSeconds = 0;
                    let durationFormatted = "0h 0m 0s";
                    let isActive = false;
                    if (task.startedAt && task.stoppedAt) {
                        // Task completed - calculate duration
                        durationSeconds = Math.floor((task.stoppedAt.getTime() - task.startedAt.getTime()) / 1000);
                        const hours = Math.floor(durationSeconds / 3600);
                        const minutes = Math.floor((durationSeconds % 3600) / 60);
                        const seconds = durationSeconds % 60;
                        durationFormatted = this.formatDuration(hours, minutes, seconds);
                    }
                    else if (task.startedAt && !task.stoppedAt) {
                        // Task in progress - calculate current duration
                        const now = new Date();
                        durationSeconds = Math.floor((now.getTime() - task.startedAt.getTime()) / 1000);
                        const hours = Math.floor(durationSeconds / 3600);
                        const minutes = Math.floor((durationSeconds % 3600) / 60);
                        const seconds = durationSeconds % 60;
                        durationFormatted = this.formatDuration(hours, minutes, seconds, true);
                        isActive = true;
                    }
                    // Convert to minutes for backward compatibility
                    const durationMinutes = Math.floor(durationSeconds / 60);
                    return {
                        ...task,
                        durationMinutes,
                        durationFormatted,
                        isActive,
                    };
                });
                // Calculate total work time for this mechanic
                const totalTaskTimeSeconds = tasksWithDuration.reduce((sum, task) => {
                    // Calculate seconds from durationMinutes
                    return sum + (task.durationMinutes * 60);
                }, 0);
                const totalHours = Math.floor(totalTaskTimeSeconds / 3600);
                const totalMinutes = Math.floor((totalTaskTimeSeconds % 3600) / 60);
                const totalSeconds = totalTaskTimeSeconds % 60;
                const totalTimeFormatted = this.formatDuration(totalHours, totalMinutes, totalSeconds);
                const totalTaskTimeMinutes = Math.floor(totalTaskTimeSeconds / 60);
                return {
                    ...mechanic,
                    tasks: tasksWithDuration,
                    totalTaskTimeMinutes: totalTaskTimeMinutes,
                    totalTaskTimeFormatted: totalTimeFormatted,
                };
            });
            res.status(200).json({
                success: true,
                message: "Activity retrieved successfully",
                data: {
                    ...activity,
                    mechanics: mechanicsWithTaskTime,
                },
            });
        }
        catch (error) {
            console.error("Get activity by id error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async updateActivity(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
            const { id } = req.params;
            const activityId = Array.isArray(id) ? id[0] : id;
            const { activityStatus, description, remarks } = req.body;
            // Check if activity exists
            const existingActivity = await this.prisma.mechanicActivity.findUnique({
                where: { id: activityId },
            });
            if (!existingActivity) {
                res.status(404).json({
                    success: false,
                    message: "Activity not found",
                });
                return;
            }
            // Build update data
            const updateData = {};
            if (activityStatus !== undefined) {
                updateData.activityStatus = activityStatus;
            }
            if (description !== undefined) {
                updateData.description = description;
            }
            if (remarks !== undefined) {
                updateData.remarks = remarks;
            }
            // Update activity
            const updatedActivity = await this.prisma.mechanicActivity.update({
                where: { id: activityId },
                data: updateData,
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
                            tasks: {
                                orderBy: {
                                    order: "asc",
                                },
                            },
                        },
                    },
                },
            });
            res.status(200).json({
                success: true,
                message: "Activity updated successfully",
                data: updatedActivity,
            });
        }
        catch (error) {
            console.error("Update activity error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
}
exports.GroupLeaderController = GroupLeaderController;
