"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MechanicsController = void 0;
class MechanicsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // Get task sequence for each activity type
    getTaskSequence(activityName) {
        const sequences = {
            PERIODIC_SERVICE: [
                { taskName: "PREPARING_PART", order: 1 },
                { taskName: "PREPARING_TOOLS", order: 2 },
                { taskName: "WASHING_UNIT", order: 3 },
                { taskName: "PRE_INSPECTION", order: 4 },
                { taskName: "PELAKSANAAN_PS", order: 5 },
                { taskName: "PELAKSANAAN_BACKLOG", order: 6 },
                { taskName: "PAP", order: 7 },
                { taskName: "PPM", order: 8 },
                { taskName: "REPORTING", order: 9 },
                { taskName: "HOUSEKEEPING", order: 10 },
            ],
            TROUBLESHOOTING: [
                { taskName: "PREPARING_PART", order: 1 },
                { taskName: "PREPARING_TOOLS", order: 2 },
                { taskName: "TRAVELING", order: 3 },
                { taskName: "ON_PROCESS", order: 4 },
                { taskName: "FINAL_CHECK", order: 5 },
                { taskName: "REPORTING", order: 6 },
            ],
            PERIODIC_INSPECTION: [
                { taskName: "PREPARING_TOOLS", order: 1 },
                { taskName: "ON_PROCESS", order: 2 },
                { taskName: "FINAL_CHECK_AND_GROUND_TEST", order: 3 },
                { taskName: "REPORTING", order: 4 },
                { taskName: "HOUSEKEEPING", order: 5 },
            ],
            REPAIR_AND_ADJUSTMENT: [
                { taskName: "PREPARING_TOOLS", order: 1 },
                { taskName: "ON_PROCESS", order: 2 },
                { taskName: "FINAL_CHECK", order: 3 },
                { taskName: "REPORTING", order: 4 },
            ],
            GENERAL_REPAIR: [
                { taskName: "PREPARING_PART", order: 1 },
                { taskName: "PREPARING_TOOLS", order: 2 },
                { taskName: "ON_PROCESS", order: 3 },
                { taskName: "FINAL_CHECK", order: 4 },
                { taskName: "REPORTING", order: 5 },
                { taskName: "HOUSEKEEPING", order: 6 },
            ],
            PERIODIC_INSPECTION_TYRE: [
                { taskName: "PREPARING_TOOLS", order: 1 },
                { taskName: "ON_PROCESS", order: 2 },
                { taskName: "FINAL_CHECK_AND_GROUND_TEST", order: 3 },
                { taskName: "REPORTING", order: 4 },
                { taskName: "HOUSEKEEPING", order: 5 },
            ],
            PERIODIC_SERVICE_TYRE: [
                { taskName: "PREPARING_PARTS", order: 1 },
                { taskName: "PREPARING_TOOLS", order: 2 },
                { taskName: "WASHING_UNITS", order: 3 },
                { taskName: "PRE_INSPECTION", order: 4 },
                { taskName: "REMOVE_INSTALL_TYRE", order: 5 },
                { taskName: "REPORTING", order: 6 },
                { taskName: "HOUSEKEEPING", order: 7 },
            ],
            RETORQUE_TYRE: [
                { taskName: "PREPARING_TOOLS", order: 1 },
                { taskName: "RETORQUE", order: 2 },
                { taskName: "REPORTING", order: 3 },
            ],
            REPAIR_TYRE: [
                { taskName: "PREPARING_TYRE_AND_MATERIAL", order: 1 },
                { taskName: "PREPARING_TOOLS", order: 2 },
                { taskName: "ON_PROCESS", order: 3 },
                { taskName: "FINAL_CHECK", order: 4 },
                { taskName: "HOUSEKEEPING", order: 5 },
            ],
            TROUBLESHOOTING_TYRE: [
                { taskName: "PREPARING_PART", order: 1 },
                { taskName: "PREPARING_TOOLS", order: 2 },
                { taskName: "TRAVELING", order: 3 },
                { taskName: "ON_PROCESS", order: 4 },
                { taskName: "FINAL_CHECK", order: 5 },
                { taskName: "REPORTING", order: 6 },
            ],
            SCHEDULED_MAINTENANCE: [
                { taskName: "PREPARING_PART", order: 1 },
                { taskName: "PREPARING_TOOLS", order: 2 },
                { taskName: "WASHING_UNIT", order: 3 },
                { taskName: "PRE_INSPECTION", order: 4 },
                { taskName: "ON_PROCESS", order: 5 },
                { taskName: "FINAL_CHECK", order: 6 },
                { taskName: "REPORTING", order: 7 },
                { taskName: "HOUSEKEEPING", order: 8 },
            ],
            UNSCHEDULED_MAINTENANCE: [
                { taskName: "PREPARING_PART", order: 1 },
                { taskName: "PREPARING_TOOLS", order: 2 },
                { taskName: "TRAVELING", order: 3 },
                { taskName: "ON_PROCESS", order: 4 },
                { taskName: "FINAL_CHECK", order: 5 },
                { taskName: "REPORTING", order: 6 },
                { taskName: "HOUSEKEEPING", order: 7 },
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
            "SCHEDULED_MAINTENANCE",
            "UNSCHEDULED_MAINTENANCE",
        ];
        return supportedActivities.includes(activityName);
    }
    // Helper method to update main activity status when activity is started
    async updateMainActivityStatusOnStart(activityId) {
        try {
            const activity = await this.prisma.mechanicActivity.findUnique({
                where: { id: activityId },
            });
            if (activity && activity.activityStatus === "PENDING") {
                await this.prisma.mechanicActivity.update({
                    where: { id: activityId },
                    data: {
                        activityStatus: "IN_PROGRESS",
                    },
                });
            }
        }
        catch (error) {
            console.error("Error updating main activity status on start:", error);
        }
    }
    // Helper method to update main activity status when all mechanics complete
    async updateMainActivityStatus(activityId) {
        try {
            // Get all mechanics assigned to this activity with their tasks
            const allAssignments = await this.prisma.activityMechanic.findMany({
                where: { activityId },
                include: {
                    tasks: {
                        orderBy: {
                            order: "asc",
                        },
                    },
                },
            });
            if (allAssignments.length === 0) {
                return;
            }
            // Check if all mechanics have completed their work
            // For activities with tasks: all tasks must be completed
            // For activities without tasks: assignment status must be COMPLETED
            const activity = await this.prisma.mechanicActivity.findUnique({
                where: { id: activityId },
            });
            if (!activity) {
                return;
            }
            const supportsTasks = this.supportsTasks(activity.activityName);
            let allCompleted = true;
            for (const assignment of allAssignments) {
                if (supportsTasks) {
                    // For activities with tasks: check if all tasks are completed
                    if (assignment.tasks.length === 0) {
                        allCompleted = false;
                        break;
                    }
                    const allTasksCompleted = assignment.tasks.every((task) => task.startedAt && task.stoppedAt);
                    if (!allTasksCompleted) {
                        allCompleted = false;
                        break;
                    }
                }
                else {
                    // For activities without tasks: check assignment status
                    if (assignment.status !== "COMPLETED" || !assignment.stoppedAt) {
                        allCompleted = false;
                        break;
                    }
                }
            }
            if (allCompleted) {
                // Update main activity status to COMPLETED
                await this.prisma.mechanicActivity.update({
                    where: { id: activityId },
                    data: {
                        activityStatus: "COMPLETED",
                    },
                });
            }
            else {
                // Check if at least one mechanic has started
                const hasInProgress = allAssignments.some((assignment) => {
                    if (supportsTasks) {
                        // Check if any task is started
                        return assignment.tasks.some((task) => task.startedAt);
                    }
                    else {
                        return (assignment.status === "IN_PROGRESS" ||
                            assignment.status === "DELAYED");
                    }
                });
                if (hasInProgress) {
                    // Update main activity status to IN_PROGRESS if still PENDING
                    if (activity.activityStatus === "PENDING") {
                        await this.prisma.mechanicActivity.update({
                            where: { id: activityId },
                            data: {
                                activityStatus: "IN_PROGRESS",
                            },
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error("Error updating main activity status:", error);
        }
    }
    async createWorkTime(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
            const { date, workTime, pauseTime } = req.body;
            // Validation
            if (!date || workTime === undefined || pauseTime === undefined) {
                res.status(400).json({
                    success: false,
                    message: "Missing required fields: date, workTime, pauseTime",
                });
                return;
            }
            // Validate workTime and pauseTime
            if (workTime < 0 || pauseTime < 0) {
                res.status(400).json({
                    success: false,
                    message: "workTime and pauseTime must be positive numbers",
                });
                return;
            }
            // Validate date
            const workDate = new Date(date);
            if (isNaN(workDate.getTime())) {
                res.status(400).json({
                    success: false,
                    message: "Invalid date format",
                });
                return;
            }
            // Calculate total work time
            const totalWorkTime = workTime - pauseTime;
            if (totalWorkTime < 0) {
                res.status(400).json({
                    success: false,
                    message: "pauseTime cannot be greater than workTime",
                });
                return;
            }
            // Check if work time already exists for this mechanic on this date
            const startOfDay = new Date(workDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(workDate);
            endOfDay.setHours(23, 59, 59, 999);
            const existingWorkTime = await this.prisma.mechanicWorkTime.findFirst({
                where: {
                    mechanicId: userId,
                    date: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            });
            if (existingWorkTime) {
                res.status(409).json({
                    success: false,
                    message: "Work time already exists for this date",
                });
                return;
            }
            // Create work time
            const workTimeRecord = await this.prisma.mechanicWorkTime.create({
                data: {
                    mechanicId: userId,
                    date: workDate,
                    workTime,
                    pauseTime,
                    totalWorkTime,
                    createdBy: userId,
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
            res.status(201).json({
                success: true,
                message: "Work time created successfully",
                data: workTimeRecord,
            });
        }
        catch (error) {
            console.error("Create work time error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async getAllWorkTimes(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
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
            // If user is not ADMIN or SUPERADMIN, only show their own work times
            if (req.user?.role !== "ADMIN" && req.user?.role !== "SUPERADMIN") {
                where.mechanicId = userId;
            }
            else if (mechanicId) {
                // Admin can filter by mechanicId
                const mechanicValue = Array.isArray(mechanicId)
                    ? mechanicId[0]
                    : mechanicId;
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
            const validSortFields = [
                "date",
                "createdAt",
                "updatedAt",
                "totalWorkTime",
            ];
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
    async getWorkTimeById(req, res) {
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
            const workTimeId = Array.isArray(id) ? id[0] : id;
            const workTime = await this.prisma.mechanicWorkTime.findUnique({
                where: { id: workTimeId },
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
            if (!workTime) {
                res.status(404).json({
                    success: false,
                    message: "Work time not found",
                });
                return;
            }
            // Check if user can access this work time
            if (req.user?.role !== "ADMIN" &&
                req.user?.role !== "SUPERADMIN" &&
                workTime.mechanicId !== userId) {
                res.status(403).json({
                    success: false,
                    message: "You don't have permission to access this work time",
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: "Work time retrieved successfully",
                data: workTime,
            });
        }
        catch (error) {
            console.error("Get work time by id error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async updateWorkTime(req, res) {
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
            const workTimeId = Array.isArray(id) ? id[0] : id;
            const { date, workTime, pauseTime } = req.body;
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
            // Check permission - only owner or admin can update
            if (req.user?.role !== "ADMIN" &&
                req.user?.role !== "SUPERADMIN" &&
                existingWorkTime.mechanicId !== userId) {
                res.status(403).json({
                    success: false,
                    message: "You don't have permission to update this work time",
                });
                return;
            }
            // Validate workTime and pauseTime if provided
            if (workTime !== undefined && workTime < 0) {
                res.status(400).json({
                    success: false,
                    message: "workTime must be a positive number",
                });
                return;
            }
            if (pauseTime !== undefined && pauseTime < 0) {
                res.status(400).json({
                    success: false,
                    message: "pauseTime must be a positive number",
                });
                return;
            }
            // Calculate total work time
            const finalWorkTime = workTime !== undefined ? workTime : existingWorkTime.workTime;
            const finalPauseTime = pauseTime !== undefined ? pauseTime : existingWorkTime.pauseTime;
            const totalWorkTime = finalWorkTime - finalPauseTime;
            if (totalWorkTime < 0) {
                res.status(400).json({
                    success: false,
                    message: "pauseTime cannot be greater than workTime",
                });
                return;
            }
            // Validate date if provided
            let workDate = existingWorkTime.date;
            if (date) {
                const newDate = new Date(date);
                if (isNaN(newDate.getTime())) {
                    res.status(400).json({
                        success: false,
                        message: "Invalid date format",
                    });
                    return;
                }
                workDate = newDate;
            }
            // Build update data
            const updateData = {};
            if (date !== undefined)
                updateData.date = workDate;
            if (workTime !== undefined)
                updateData.workTime = workTime;
            if (pauseTime !== undefined)
                updateData.pauseTime = pauseTime;
            if (workTime !== undefined || pauseTime !== undefined)
                updateData.totalWorkTime = totalWorkTime;
            updateData.updatedBy = userId;
            // Check if there's anything to update
            if (Object.keys(updateData).length === 0) {
                res.status(400).json({
                    success: false,
                    message: "No fields to update",
                });
                return;
            }
            // Update work time
            const updatedWorkTime = await this.prisma.mechanicWorkTime.update({
                where: { id: workTimeId },
                data: updateData,
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
            res.status(200).json({
                success: true,
                message: "Work time updated successfully",
                data: updatedWorkTime,
            });
        }
        catch (error) {
            console.error("Update work time error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async deleteWorkTime(req, res) {
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
            // Check permission - only owner or admin can delete
            if (req.user?.role !== "ADMIN" &&
                req.user?.role !== "SUPERADMIN" &&
                existingWorkTime.mechanicId !== userId) {
                res.status(403).json({
                    success: false,
                    message: "You don't have permission to delete this work time",
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
    async startActivity(req, res) {
        try {
            const userId = req.user?.id;
            const userPosisi = req.user?.posisi;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
            // Only GROUP_LEADER_MEKANIK and GROUP_LEADER_TYRE can start activities
            if (userPosisi !== "GROUP_LEADER_MEKANIK" &&
                userPosisi !== "GROUP_LEADER_TYRE") {
                res.status(403).json({
                    success: false,
                    message: "Only Group Leaders can start activities",
                });
                return;
            }
            const { activityId } = req.params;
            const id = Array.isArray(activityId) ? activityId[0] : activityId;
            // Check if activity assignment exists
            const assignment = await this.prisma.activityMechanic.findFirst({
                where: {
                    activityId: id,
                    mechanicId: userId,
                },
                include: {
                    activity: {
                        include: {
                            unit: {
                                select: {
                                    id: true,
                                    unitCode: true,
                                    unitType: true,
                                    unitBrand: true,
                                },
                            },
                        },
                    },
                    tasks: {
                        orderBy: {
                            order: "asc",
                        },
                    },
                },
            });
            if (!assignment) {
                res.status(404).json({
                    success: false,
                    message: "Activity assignment not found",
                });
                return;
            }
            // Check if already started
            if (assignment.status === "IN_PROGRESS" && assignment.startedAt) {
                res.status(400).json({
                    success: false,
                    message: "Activity already started",
                });
                return;
            }
            // Check if already stopped
            if (assignment.status === "COMPLETED" || assignment.stoppedAt) {
                res.status(400).json({
                    success: false,
                    message: "Activity already completed",
                });
                return;
            }
            const startTime = new Date();
            const activityName = assignment.activity.activityName;
            // Check if activity supports tasks
            const supportsTasks = this.supportsTasks(activityName);
            // Start activity
            const updateData = {
                status: "IN_PROGRESS",
                startedAt: startTime,
            };
            // Handle tasks if activity supports tasks
            if (supportsTasks) {
                const taskSequence = this.getTaskSequence(activityName);
                if (taskSequence.length > 0) {
                    // Check if any tasks exist
                    if (assignment.tasks.length === 0) {
                        // No tasks exist, create ALL tasks from sequence
                        // First task will be started, others will be created but not started
                        const tasksToCreate = taskSequence.map((task, index) => ({
                            taskName: task.taskName,
                            order: task.order,
                            startedAt: index === 0 ? startTime : null, // Only first task is started
                        }));
                        updateData.tasks = {
                            create: tasksToCreate,
                        };
                    }
                    else {
                        // Some tasks exist, find and start the first task
                        const firstTask = taskSequence[0];
                        const existingFirstTask = assignment.tasks.find((t) => t.taskName === firstTask.taskName);
                        if (existingFirstTask) {
                            // First task exists, start it if not already started
                            if (!existingFirstTask.startedAt) {
                                await this.prisma.task.update({
                                    where: { id: existingFirstTask.id },
                                    data: {
                                        startedAt: startTime,
                                    },
                                });
                            }
                        }
                        else {
                            // First task doesn't exist but other tasks do (unusual case)
                            // Create and start the first task
                            await this.prisma.task.create({
                                data: {
                                    activityMechanicId: assignment.id,
                                    taskName: firstTask.taskName,
                                    order: firstTask.order,
                                    startedAt: startTime,
                                },
                            });
                        }
                        // Create any missing tasks from the sequence
                        const existingTaskNames = assignment.tasks.map((t) => t.taskName);
                        const missingTasks = taskSequence.filter((task) => !existingTaskNames.includes(task.taskName));
                        if (missingTasks.length > 0) {
                            await this.prisma.task.createMany({
                                data: missingTasks.map((task) => ({
                                    activityMechanicId: assignment.id,
                                    taskName: task.taskName,
                                    order: task.order,
                                })),
                            });
                        }
                    }
                }
            }
            const updated = await this.prisma.activityMechanic.update({
                where: { id: assignment.id },
                data: updateData,
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
                    activity: {
                        include: {
                            unit: {
                                select: {
                                    id: true,
                                    unitCode: true,
                                    unitType: true,
                                    unitBrand: true,
                                },
                            },
                        },
                    },
                    tasks: {
                        orderBy: {
                            order: "asc",
                        },
                    },
                },
            });
            // Update main activity status to IN_PROGRESS if still PENDING
            await this.updateMainActivityStatusOnStart(assignment.activityId);
            res.status(200).json({
                success: true,
                message: "Activity started successfully",
                data: updated,
            });
        }
        catch (error) {
            console.error("Start activity error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async pauseActivity(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
            const { activityId } = req.params;
            const id = Array.isArray(activityId) ? activityId[0] : activityId;
            const { pauseReason } = req.body;
            // Check if activity assignment exists
            const assignment = await this.prisma.activityMechanic.findFirst({
                where: {
                    activityId: id,
                    mechanicId: userId,
                },
            });
            if (!assignment) {
                res.status(404).json({
                    success: false,
                    message: "Activity assignment not found",
                });
                return;
            }
            // Check if not started
            if (!assignment.startedAt || assignment.status !== "IN_PROGRESS") {
                res.status(400).json({
                    success: false,
                    message: "Activity must be started before pausing",
                });
                return;
            }
            // Check if already stopped
            if (assignment.stoppedAt) {
                res.status(400).json({
                    success: false,
                    message: "Cannot pause a completed activity",
                });
                return;
            }
            // Validate pause reason
            const validPauseReasons = ["WAITING_PARTS", "REST_AND_PRAY", "OTHER"];
            if (pauseReason && !validPauseReasons.includes(pauseReason)) {
                res.status(400).json({
                    success: false,
                    message: `Invalid pauseReason. Valid reasons are: ${validPauseReasons.join(", ")}`,
                });
                return;
            }
            // Pause activity
            const updated = await this.prisma.activityMechanic.update({
                where: { id: assignment.id },
                data: {
                    status: "DELAYED",
                    pausedAt: new Date(),
                    pauseReason: pauseReason ? pauseReason : null,
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
                    activity: {
                        include: {
                            unit: {
                                select: {
                                    id: true,
                                    unitCode: true,
                                    unitType: true,
                                    unitBrand: true,
                                },
                            },
                        },
                    },
                },
            });
            res.status(200).json({
                success: true,
                message: "Activity paused successfully",
                data: updated,
            });
        }
        catch (error) {
            console.error("Pause activity error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async resumeActivity(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
            const { activityId } = req.params;
            const id = Array.isArray(activityId) ? activityId[0] : activityId;
            // Check if activity assignment exists
            const assignment = await this.prisma.activityMechanic.findFirst({
                where: {
                    activityId: id,
                    mechanicId: userId,
                },
            });
            if (!assignment) {
                res.status(404).json({
                    success: false,
                    message: "Activity assignment not found",
                });
                return;
            }
            // Check if not paused
            if (!assignment.pausedAt || assignment.status !== "DELAYED") {
                res.status(400).json({
                    success: false,
                    message: "Activity is not paused",
                });
                return;
            }
            // Calculate pause duration and add to total work time
            const pauseDuration = Math.floor((new Date().getTime() - assignment.pausedAt.getTime()) / 60000);
            // Resume activity
            const updated = await this.prisma.activityMechanic.update({
                where: { id: assignment.id },
                data: {
                    status: "IN_PROGRESS",
                    pausedAt: null,
                    pauseReason: null,
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
                    activity: {
                        include: {
                            unit: {
                                select: {
                                    id: true,
                                    unitCode: true,
                                    unitType: true,
                                    unitBrand: true,
                                },
                            },
                        },
                    },
                },
            });
            res.status(200).json({
                success: true,
                message: "Activity resumed successfully",
                data: updated,
            });
        }
        catch (error) {
            console.error("Resume activity error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async stopActivity(req, res) {
        try {
            const userId = req.user?.id;
            const userPosisi = req.user?.posisi;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
            // Only GROUP_LEADER_MEKANIK and GROUP_LEADER_TYRE can stop activities
            if (userPosisi !== "GROUP_LEADER_MEKANIK" &&
                userPosisi !== "GROUP_LEADER_TYRE") {
                res.status(403).json({
                    success: false,
                    message: "Only Group Leaders can stop activities",
                });
                return;
            }
            const { activityId } = req.params;
            const id = Array.isArray(activityId) ? activityId[0] : activityId;
            // Check if activity assignment exists
            const assignment = await this.prisma.activityMechanic.findFirst({
                where: {
                    activityId: id,
                    mechanicId: userId,
                },
            });
            if (!assignment) {
                res.status(404).json({
                    success: false,
                    message: "Activity assignment not found",
                });
                return;
            }
            // Check if not started
            if (!assignment.startedAt) {
                res.status(400).json({
                    success: false,
                    message: "Activity must be started before stopping",
                });
                return;
            }
            // Check if already stopped
            if (assignment.stoppedAt || assignment.status === "COMPLETED") {
                res.status(400).json({
                    success: false,
                    message: "Activity already completed",
                });
                return;
            }
            // Calculate total work time
            const stopTime = new Date();
            let totalWorkTime = 0;
            if (assignment.startedAt) {
                const baseTime = stopTime.getTime() - assignment.startedAt.getTime();
                totalWorkTime = Math.floor(baseTime / 60000); // Convert to minutes
                // Subtract pause time if any
                if (assignment.pausedAt) {
                    const pauseTime = Math.floor((stopTime.getTime() - assignment.pausedAt.getTime()) / 60000);
                    totalWorkTime -= pauseTime;
                }
            }
            // Stop activity
            const updated = await this.prisma.activityMechanic.update({
                where: { id: assignment.id },
                data: {
                    status: "COMPLETED",
                    stoppedAt: stopTime,
                    totalWorkTime: totalWorkTime > 0 ? totalWorkTime : 0,
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
                    activity: {
                        include: {
                            unit: {
                                select: {
                                    id: true,
                                    unitCode: true,
                                    unitType: true,
                                    unitBrand: true,
                                },
                            },
                        },
                    },
                },
            });
            // Update main activity status if all mechanics are completed
            await this.updateMainActivityStatus(assignment.activityId);
            res.status(200).json({
                success: true,
                message: "Activity stopped successfully",
                data: updated,
            });
        }
        catch (error) {
            console.error("Stop activity error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async getMyActivities(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
            const { status, page = "1", limit = "10", sortBy = "createdAt", sortOrder = "desc", } = req.query;
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
            const where = {
                mechanicId: userId,
            };
            if (status) {
                const statusValue = Array.isArray(status) ? status[0] : status;
                where.status = statusValue;
            }
            // Validate sortBy
            const validSortFields = ["createdAt", "updatedAt", "startedAt", "status"];
            const sortField = validSortFields.includes(sortBy)
                ? sortBy
                : "createdAt";
            const order = sortOrder === "asc" ? "asc" : "desc";
            // Get total count
            const totalCount = await this.prisma.activityMechanic.count({ where });
            // Get paginated activities
            const activities = await this.prisma.activityMechanic.findMany({
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
                    activity: {
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
                        },
                    },
                    tasks: {
                        orderBy: {
                            order: "asc",
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
            console.error("Get my activities error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async startTask(req, res) {
        try {
            const userId = req.user?.id;
            const userPosisi = req.user?.posisi;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
            // Only GROUP_LEADER_MEKANIK and GROUP_LEADER_TYRE can start tasks
            if (userPosisi !== "GROUP_LEADER_MEKANIK" &&
                userPosisi !== "GROUP_LEADER_TYRE") {
                res.status(403).json({
                    success: false,
                    message: "Only Group Leaders can start tasks",
                });
                return;
            }
            const { activityId } = req.params;
            const { taskName } = req.body;
            const id = Array.isArray(activityId) ? activityId[0] : activityId;
            // Check if activity assignment exists
            const assignment = await this.prisma.activityMechanic.findFirst({
                where: {
                    activityId: id,
                    mechanicId: userId,
                },
                include: {
                    activity: true,
                    tasks: {
                        orderBy: {
                            order: "asc",
                        },
                    },
                },
            });
            if (!assignment) {
                res.status(404).json({
                    success: false,
                    message: "Activity assignment not found",
                });
                return;
            }
            // Check if activity supports tasks
            const activityName = assignment.activity.activityName;
            if (!this.supportsTasks(activityName)) {
                res.status(400).json({
                    success: false,
                    message: "Tasks are not available for this activity type",
                });
                return;
            }
            // Validate taskName against activity's task sequence
            const taskSequence = this.getTaskSequence(activityName);
            const validTaskNames = taskSequence.map((t) => t.taskName);
            if (!taskName || !validTaskNames.includes(taskName)) {
                res.status(400).json({
                    success: false,
                    message: `Invalid taskName for ${activityName}. Valid names are: ${validTaskNames.join(", ")}`,
                });
                return;
            }
            // Check if activity is started
            if (!assignment.startedAt || assignment.status !== "IN_PROGRESS") {
                res.status(400).json({
                    success: false,
                    message: "Activity must be started before starting a task",
                });
                return;
            }
            // Build task order from sequence
            const taskOrder = {};
            taskSequence.forEach((task) => {
                taskOrder[task.taskName] = task.order;
            });
            const currentTaskOrder = taskOrder[taskName];
            // Check if previous tasks are completed
            for (let i = 1; i < currentTaskOrder; i++) {
                const prevTaskName = Object.keys(taskOrder).find((key) => taskOrder[key] === i);
                const prevTask = assignment.tasks.find((t) => t.taskName === prevTaskName);
                if (!prevTask || !prevTask.stoppedAt) {
                    res.status(400).json({
                        success: false,
                        message: `Please complete ${prevTaskName?.replace(/_/g, " ")} first`,
                    });
                    return;
                }
            }
            // Check if task already exists and started
            const existingTask = assignment.tasks.find((t) => t.taskName === taskName);
            if (existingTask && existingTask.startedAt) {
                res.status(400).json({
                    success: false,
                    message: "Task already started",
                });
                return;
            }
            const startTime = new Date();
            // Create or update task
            let task;
            if (existingTask) {
                task = await this.prisma.task.update({
                    where: { id: existingTask.id },
                    data: {
                        startedAt: startTime,
                    },
                });
            }
            else {
                task = await this.prisma.task.create({
                    data: {
                        activityMechanicId: assignment.id,
                        taskName: taskName,
                        order: currentTaskOrder,
                        startedAt: startTime,
                    },
                });
            }
            // Get updated assignment with tasks
            const updated = await this.prisma.activityMechanic.findUnique({
                where: { id: assignment.id },
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
                    activity: {
                        include: {
                            unit: {
                                select: {
                                    id: true,
                                    unitCode: true,
                                    unitType: true,
                                    unitBrand: true,
                                },
                            },
                        },
                    },
                    tasks: {
                        orderBy: {
                            order: "asc",
                        },
                    },
                },
            });
            res.status(200).json({
                success: true,
                message: "Task started successfully",
                data: updated,
            });
        }
        catch (error) {
            console.error("Start task error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async stopTask(req, res) {
        try {
            const userId = req.user?.id;
            const userPosisi = req.user?.posisi;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
            // Only GROUP_LEADER_MEKANIK and GROUP_LEADER_TYRE can stop tasks
            if (userPosisi !== "GROUP_LEADER_MEKANIK" &&
                userPosisi !== "GROUP_LEADER_TYRE") {
                res.status(403).json({
                    success: false,
                    message: "Only Group Leaders can stop tasks",
                });
                return;
            }
            const { activityId } = req.params;
            const { taskName } = req.body;
            const id = Array.isArray(activityId) ? activityId[0] : activityId;
            // Check if activity assignment exists
            const assignment = await this.prisma.activityMechanic.findFirst({
                where: {
                    activityId: id,
                    mechanicId: userId,
                },
                include: {
                    activity: true,
                    tasks: true,
                },
            });
            if (!assignment) {
                res.status(404).json({
                    success: false,
                    message: "Activity assignment not found",
                });
                return;
            }
            // Check if activity supports tasks
            const activityName = assignment.activity.activityName;
            if (!this.supportsTasks(activityName)) {
                res.status(400).json({
                    success: false,
                    message: "Tasks are not available for this activity type",
                });
                return;
            }
            // Validate taskName against activity's task sequence
            const taskSequence = this.getTaskSequence(activityName);
            const validTaskNames = taskSequence.map((t) => t.taskName);
            if (!taskName || !validTaskNames.includes(taskName)) {
                res.status(400).json({
                    success: false,
                    message: `Invalid taskName for ${activityName}. Valid names are: ${validTaskNames.join(", ")}`,
                });
                return;
            }
            // Find the task
            const task = assignment.tasks.find((t) => t.taskName === taskName);
            if (!task) {
                res.status(404).json({
                    success: false,
                    message: "Task not found",
                });
                return;
            }
            // Check if task is started
            if (!task.startedAt) {
                res.status(400).json({
                    success: false,
                    message: "Task must be started before stopping",
                });
                return;
            }
            // Check if task is already stopped
            if (task.stoppedAt) {
                res.status(400).json({
                    success: false,
                    message: "Task already stopped",
                });
                return;
            }
            const stopTime = new Date();
            // Stop the task
            await this.prisma.task.update({
                where: { id: task.id },
                data: {
                    stoppedAt: stopTime,
                },
            });
            // Check if all tasks for this mechanic are completed
            const allTasks = await this.prisma.task.findMany({
                where: { activityMechanicId: assignment.id },
                orderBy: {
                    order: "asc",
                },
            });
            // Check if all tasks are completed (all have startedAt and stoppedAt)
            const allTasksCompleted = allTasks.length > 0 &&
                allTasks.every((t) => t.startedAt && t.stoppedAt);
            // If all tasks are completed, mark the mechanic assignment as COMPLETED
            if (allTasksCompleted) {
                // Calculate total work time from all tasks
                let totalWorkTime = 0;
                for (const t of allTasks) {
                    if (t.startedAt && t.stoppedAt) {
                        const taskTime = Math.floor((t.stoppedAt.getTime() - t.startedAt.getTime()) / 60000);
                        totalWorkTime += taskTime;
                    }
                }
                await this.prisma.activityMechanic.update({
                    where: { id: assignment.id },
                    data: {
                        status: "COMPLETED",
                        stoppedAt: stopTime,
                        totalWorkTime,
                    },
                });
                // Update main activity status if all mechanics are completed
                await this.updateMainActivityStatus(assignment.activityId);
            }
            // Get updated assignment with tasks
            const updated = await this.prisma.activityMechanic.findUnique({
                where: { id: assignment.id },
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
                    activity: {
                        include: {
                            unit: {
                                select: {
                                    id: true,
                                    unitCode: true,
                                    unitType: true,
                                    unitBrand: true,
                                },
                            },
                        },
                    },
                    tasks: {
                        orderBy: {
                            order: "asc",
                        },
                    },
                },
            });
            res.status(200).json({
                success: true,
                message: "Task stopped successfully",
                data: updated,
            });
        }
        catch (error) {
            console.error("Stop task error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
}
exports.MechanicsController = MechanicsController;
