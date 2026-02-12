import { Request, Response } from "express";
import { PrismaClient, TaskName } from "@prisma/client";

export class GroupLeaderController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Get task sequence for each activity type
  private getTaskSequence(
    activityName: string,
  ): { taskName: TaskName; order: number }[] {
    const sequences: Record<string, { taskName: TaskName; order: number }[]> = {
      PERIODIC_SERVICE: [
        { taskName: TaskName.PREPARING_PART, order: 1 },
        { taskName: TaskName.PREPARING_TOOLS, order: 2 },
        { taskName: TaskName.WASHING_UNIT, order: 3 },
        { taskName: TaskName.PRE_INSPECTION, order: 4 },
        { taskName: TaskName.PELAKSANAAN_PS, order: 5 },
        { taskName: TaskName.PELAKSANAAN_BACKLOG, order: 6 },
        { taskName: TaskName.PAP, order: 7 },
        { taskName: TaskName.PPM, order: 8 },
        { taskName: TaskName.REPORTING, order: 9 },
        { taskName: TaskName.HOUSEKEEPING, order: 10 },
      ],
      TROUBLESHOOTING: [
        { taskName: TaskName.PREPARING_PART, order: 1 },
        { taskName: TaskName.PREPARING_TOOLS, order: 2 },
        { taskName: TaskName.TRAVELING, order: 3 },
        { taskName: TaskName.ON_PROCESS, order: 4 },
        { taskName: TaskName.FINAL_CHECK, order: 5 },
        { taskName: TaskName.REPORTING, order: 6 },
      ],
      PERIODIC_INSPECTION: [
        { taskName: TaskName.PREPARING_TOOLS, order: 1 },
        { taskName: TaskName.ON_PROCESS, order: 2 },
        { taskName: TaskName.FINAL_CHECK_AND_GROUND_TEST, order: 3 },
        { taskName: TaskName.REPORTING, order: 4 },
        { taskName: TaskName.HOUSEKEEPING, order: 5 },
      ],
      REPAIR_AND_ADJUSTMENT: [
        { taskName: TaskName.PREPARING_TOOLS, order: 1 },
        { taskName: TaskName.ON_PROCESS, order: 2 },
        { taskName: TaskName.FINAL_CHECK, order: 3 },
        { taskName: TaskName.REPORTING, order: 4 },
      ],
      GENERAL_REPAIR: [
        { taskName: TaskName.PREPARING_PART, order: 1 },
        { taskName: TaskName.PREPARING_TOOLS, order: 2 },
        { taskName: TaskName.ON_PROCESS, order: 3 },
        { taskName: TaskName.FINAL_CHECK, order: 4 },
        { taskName: TaskName.REPORTING, order: 5 },
        { taskName: TaskName.HOUSEKEEPING, order: 6 },
      ],
      PERIODIC_INSPECTION_TYRE: [
        { taskName: TaskName.PREPARING_TOOLS, order: 1 },
        { taskName: TaskName.ON_PROCESS, order: 2 },
        { taskName: TaskName.FINAL_CHECK_AND_GROUND_TEST, order: 3 },
        { taskName: TaskName.REPORTING, order: 4 },
        { taskName: TaskName.HOUSEKEEPING, order: 5 },
      ],
      PERIODIC_SERVICE_TYRE: [
        { taskName: TaskName.PREPARING_PARTS, order: 1 },
        { taskName: TaskName.PREPARING_TOOLS, order: 2 },
        { taskName: TaskName.WASHING_UNITS, order: 3 },
        { taskName: TaskName.PRE_INSPECTION, order: 4 },
        { taskName: TaskName.REMOVE_INSTALL_TYRE, order: 5 },
        { taskName: TaskName.REPORTING, order: 6 },
        { taskName: TaskName.HOUSEKEEPING, order: 7 },
      ],
      RETORQUE_TYRE: [
        { taskName: TaskName.PREPARING_TOOLS, order: 1 },
        { taskName: TaskName.RETORQUE, order: 2 },
        { taskName: TaskName.REPORTING, order: 3 },
      ],
      REPAIR_TYRE: [
        { taskName: TaskName.PREPARING_TYRE_AND_MATERIAL, order: 1 },
        { taskName: TaskName.PREPARING_TOOLS, order: 2 },
        { taskName: TaskName.ON_PROCESS, order: 3 },
        { taskName: TaskName.FINAL_CHECK, order: 4 },
        { taskName: TaskName.HOUSEKEEPING, order: 5 },
      ],
      TROUBLESHOOTING_TYRE: [
        { taskName: TaskName.PREPARING_PART, order: 1 },
        { taskName: TaskName.PREPARING_TOOLS, order: 2 },
        { taskName: TaskName.TRAVELING, order: 3 },
        { taskName: TaskName.ON_PROCESS, order: 4 },
        { taskName: TaskName.FINAL_CHECK, order: 5 },
        { taskName: TaskName.REPORTING, order: 6 },
      ],
    };

    return sequences[activityName] || [];
  }

  // Check if activity type supports tasks
  private supportsTasks(activityName: string): boolean {
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

  async assignMechanics(req: Request, res: Response): Promise<void> {
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

      // Verify that the current user is assigned as Group Leader for this activity
      // Admin and SuperAdmin can assign mechanics to any activity
      const userPosisi = req.user?.posisi;
      const userRole = req.user?.role;
      
      if (
        (userPosisi === "GROUP_LEADER_MEKANIK" ||
          userPosisi === "GROUP_LEADER_TYRE") &&
        userRole !== "ADMIN" &&
        userRole !== "SUPERADMIN"
      ) {
        if (activity.assignedGroupLeaderId !== userId) {
          res.status(403).json({
            success: false,
            message: "You are not assigned as Group Leader for this activity",
          });
          return;
        }
      }

      // Check if mechanics already assigned
      const existingAssignments = await this.prisma.activityMechanic.findMany({
        where: { activityId },
      });

      if (existingAssignments.length > 0) {
        res.status(400).json({
          success: false,
          message:
            "Mechanics are already assigned to this activity. Please remove existing assignments first.",
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
      const invalidMechanics = mechanics.filter(
        (m) => !validPosisis.includes(m.posisi),
      );

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
            name: mechanic
              ? `${mechanic.firstName} ${mechanic.lastName}`
              : "Unknown",
            activity: ua.activity.unit.unitCode,
            status: ua.status,
          };
        });

        res.status(400).json({
          success: false,
          message: "Cannot assign mechanics with unfinished activities",
          details: mechanicsWithUnfinished.map(
            (m) =>
              `${m.name} has unfinished activity ${m.activity} (Status: ${m.status})`,
          ),
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
            create: mechanicIds.map((mechanicId: string) => ({
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
    } catch (error) {
      console.error("Assign mechanics error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  async getMechanics(req: Request, res: Response): Promise<void> {
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
      const unfinishedAssignments = await this.prisma.activityMechanic.findMany(
        {
          where: {
            status: {
              not: "COMPLETED",
            },
          },
          select: {
            mechanicId: true,
          },
        },
      );

      const busyMechanicIds = new Set(
        unfinishedAssignments.map((ua) => ua.mechanicId),
      );

      // Filter out mechanics with unfinished activities
      const availableMechanics = allMechanics.filter(
        (mechanic) => !busyMechanicIds.has(mechanic.id),
      );

      res.status(200).json({
        success: true,
        message: "Mechanics retrieved successfully",
        data: availableMechanics,
      });
    } catch (error) {
      console.error("Get mechanics error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  // Helper method to format duration
  private formatDuration(
    hours: number,
    minutes: number,
    seconds: number,
    isActive: boolean = false,
  ): string {
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(" ") + (isActive ? " (active)" : "");
  }

  async getAllActivities(req: Request, res: Response): Promise<void> {
    try {
      const {
        status,
        activityName,
        unitId,
        mechanicId,
        search,
        page = "1",
        limit = "10",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // Parse pagination
      const pageNumber = parseInt(page as string, 10) || 1;
      const limitNumber = parseInt(limit as string, 10) || 10;
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

      // Get current user ID
      const userId = req.user?.id;
      const userPosisi = req.user?.posisi;

      // Build where clause
      const where: any = {};
      
      // Filter by assigned Group Leader - only show activities assigned to current user
      // Admin and SuperAdmin can see all activities
      if (
        userPosisi === "GROUP_LEADER_MEKANIK" ||
        userPosisi === "GROUP_LEADER_TYRE"
      ) {
        if (userId) {
          where.assignedGroupLeaderId = userId;
        }
      }
      
      if (status) {
        const statusValue = Array.isArray(status) ? status[0] : status;
        where.activityStatus = statusValue;
      }
      if (activityName) {
        const nameValue = Array.isArray(activityName)
          ? activityName[0]
          : activityName;
        where.activityName = nameValue;
      }
      if (unitId) {
        const unitValue = Array.isArray(unitId) ? unitId[0] : unitId;
        where.unitId = unitValue;
      }
      if (mechanicId) {
        const mechanicValue = Array.isArray(mechanicId)
          ? mechanicId[0]
          : mechanicId;
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
            id: {
              contains: searchValue as string,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: searchValue as string,
              mode: "insensitive",
            },
          },
          {
            remarks: {
              contains: searchValue as string,
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
      const sortField = validSortFields.includes(sortBy as string)
        ? (sortBy as string)
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
          assignedGroupLeader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nrp: true,
              email: true,
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

      // Fetch creator information for all activities
      const creatorIds = [...new Set(activities.map((a) => a.createdBy))];
      const creators = await this.prisma.user.findMany({
        where: {
          id: {
            in: creatorIds,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nrp: true,
          email: true,
          posisi: true,
        },
      });
      const creatorMap = new Map(creators.map((c) => [c.id, c]));

      // Calculate task durations and format response
      const activitiesWithTaskTime = activities.map((activity) => {
        const mechanicsWithTaskTime = activity.mechanics.map((mechanic) => {
          const tasksWithDuration = mechanic.tasks.map((task) => {
            let durationSeconds = 0;
            let durationFormatted = "0s";
            let isActive = false;

            if (task.startedAt && task.stoppedAt) {
              // Task completed - calculate duration
              durationSeconds = Math.floor(
                (task.stoppedAt.getTime() - task.startedAt.getTime()) / 1000,
              );
              const hours = Math.floor(durationSeconds / 3600);
              const minutes = Math.floor((durationSeconds % 3600) / 60);
              const seconds = durationSeconds % 60;
              durationFormatted = this.formatDuration(hours, minutes, seconds);
            } else if (task.startedAt && !task.stoppedAt) {
              // Task in progress - calculate current duration
              const now = new Date();
              durationSeconds = Math.floor(
                (now.getTime() - task.startedAt.getTime()) / 1000,
              );
              const hours = Math.floor(durationSeconds / 3600);
              const minutes = Math.floor((durationSeconds % 3600) / 60);
              const seconds = durationSeconds % 60;
              durationFormatted = this.formatDuration(
                hours,
                minutes,
                seconds,
                true,
              );
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
            return sum + task.durationMinutes * 60;
          }, 0);
          const totalHours = Math.floor(totalTaskTimeSeconds / 3600);
          const totalMinutes = Math.floor((totalTaskTimeSeconds % 3600) / 60);
          const totalSeconds = totalTaskTimeSeconds % 60;
          const totalTimeFormatted = this.formatDuration(
            totalHours,
            totalMinutes,
            totalSeconds,
          );
          const totalTaskTimeMinutes = Math.floor(totalTaskTimeSeconds / 60);

          return {
            ...mechanic,
            tasks: tasksWithDuration,
            totalTaskTimeMinutes: totalTaskTimeMinutes,
            totalTaskTimeFormatted: totalTimeFormatted,
          };
        });

        // Get assigned GL from activity relation
        const assignedGL = activity.assignedGroupLeader
          ? {
              id: activity.assignedGroupLeader.id,
              firstName: activity.assignedGroupLeader.firstName,
              lastName: activity.assignedGroupLeader.lastName,
              nrp: activity.assignedGroupLeader.nrp,
              email: activity.assignedGroupLeader.email,
            }
          : null;

        // Get creator info
        const creator = creatorMap.get(activity.createdBy);

        return {
          ...activity,
          mechanics: mechanicsWithTaskTime,
          creator: creator
            ? {
                id: creator.id,
                firstName: creator.firstName,
                lastName: creator.lastName,
                nrp: creator.nrp,
                email: creator.email,
              }
            : null,
          assignedGL,
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
    } catch (error) {
      console.error("Get all activities error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  async getActivityById(req: Request, res: Response): Promise<void> {
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

      // Fetch creator information
      const creator = await this.prisma.user.findUnique({
        where: { id: activity.createdBy },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nrp: true,
          email: true,
        },
      });

      // Calculate task durations and format response
      const mechanicsWithTaskTime = activity.mechanics.map((mechanic) => {
        const tasksWithDuration = mechanic.tasks.map((task) => {
          let durationSeconds = 0;
          let durationFormatted = "0h 0m 0s";
          let isActive = false;

          if (task.startedAt && task.stoppedAt) {
            // Task completed - calculate duration
            durationSeconds = Math.floor(
              (task.stoppedAt.getTime() - task.startedAt.getTime()) / 1000,
            );
            const hours = Math.floor(durationSeconds / 3600);
            const minutes = Math.floor((durationSeconds % 3600) / 60);
            const seconds = durationSeconds % 60;
            durationFormatted = this.formatDuration(hours, minutes, seconds);
          } else if (task.startedAt && !task.stoppedAt) {
            // Task in progress - calculate current duration
            const now = new Date();
            durationSeconds = Math.floor(
              (now.getTime() - task.startedAt.getTime()) / 1000,
            );
            const hours = Math.floor(durationSeconds / 3600);
            const minutes = Math.floor((durationSeconds % 3600) / 60);
            const seconds = durationSeconds % 60;
            durationFormatted = this.formatDuration(
              hours,
              minutes,
              seconds,
              true,
            );
            isActive = true;
          }

          // Convert to minutes for backward compatibility
          const durationMinutes = Math.floor(durationSeconds / 60);

          return {
            ...task,
            durationSeconds, // Store seconds for accurate calculation
            durationMinutes,
            durationFormatted,
            isActive,
          };
        });

        // Calculate total work time for this mechanic
        const totalTaskTimeSeconds = tasksWithDuration.reduce((sum, task) => {
          // Use durationSeconds directly for accurate calculation
          return sum + (task.durationSeconds || 0);
        }, 0);
        const totalHours = Math.floor(totalTaskTimeSeconds / 3600);
        const totalMinutes = Math.floor((totalTaskTimeSeconds % 3600) / 60);
        const totalSeconds = totalTaskTimeSeconds % 60;
        const totalTimeFormatted = this.formatDuration(
          totalHours,
          totalMinutes,
          totalSeconds,
        );
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
    } catch (error) {
      console.error("Get activity by id error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  async updateActivity(req: Request, res: Response): Promise<void> {
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
      const updateData: any = {};
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
    } catch (error) {
      console.error("Update activity error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  // Start activity for ALL assigned mechanics at once
  async startActivityForAllMechanics(
    req: Request,
    res: Response,
  ): Promise<void> {
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

      // Check if activity exists
      const activity = await this.prisma.mechanicActivity.findUnique({
        where: { id: activityId },
        include: {
          mechanics: {
            include: {
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

      // Check if any mechanics are assigned
      if (activity.mechanics.length === 0) {
        res.status(400).json({
          success: false,
          message: "No mechanics assigned to this activity",
        });
        return;
      }

      const startTime = new Date();
      const activityName = activity.activityName;
      const supportsTasks = this.supportsTasks(activityName);
      const taskSequence = supportsTasks
        ? this.getTaskSequence(activityName)
        : [];

      // Start all mechanics' activities
      const updatePromises = activity.mechanics.map(async (mechanic) => {
        // Skip if already started or completed
        if (
          mechanic.status === "IN_PROGRESS" ||
          mechanic.status === "COMPLETED"
        ) {
          return null;
        }

        // Handle tasks if activity supports tasks
        if (supportsTasks && taskSequence.length > 0) {
          if (mechanic.tasks.length === 0) {
            // Create all tasks, start first one
            const tasksToCreate = taskSequence.map((task, index) => ({
              activityMechanicId: mechanic.id,
              taskName: task.taskName,
              order: task.order,
              startedAt: index === 0 ? startTime : null,
            }));

            await this.prisma.task.createMany({
              data: tasksToCreate,
            });
          } else {
            // Start first task if not started
            const firstTask = taskSequence[0];
            const existingFirstTask = mechanic.tasks.find(
              (t) => t.taskName === firstTask.taskName,
            );

            if (existingFirstTask && !existingFirstTask.startedAt) {
              await this.prisma.task.update({
                where: { id: existingFirstTask.id },
                data: { startedAt: startTime },
              });
            }
          }
        }

        // Update mechanic assignment status
        return this.prisma.activityMechanic.update({
          where: { id: mechanic.id },
          data: {
            status: "IN_PROGRESS",
            startedAt: startTime,
          },
        });
      });

      await Promise.all(updatePromises);

      // Update main activity status to IN_PROGRESS
      await this.prisma.mechanicActivity.update({
        where: { id: activityId },
        data: {
          activityStatus: "IN_PROGRESS",
        },
      });

      // Fetch updated activity
      const updatedActivity = await this.prisma.mechanicActivity.findUnique({
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

      res.status(200).json({
        success: true,
        message: "Activity started for all mechanics successfully",
        data: updatedActivity,
      });
    } catch (error) {
      console.error("Start activity for all mechanics error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  // Stop activity for ALL assigned mechanics at once
  async stopActivityForAllMechanics(
    req: Request,
    res: Response,
  ): Promise<void> {
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

      // Check if activity exists
      const activity = await this.prisma.mechanicActivity.findUnique({
        where: { id: activityId },
        include: {
          mechanics: {
            include: {
              tasks: true,
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

      // Check if any mechanics are assigned
      if (activity.mechanics.length === 0) {
        res.status(400).json({
          success: false,
          message: "No mechanics assigned to this activity",
        });
        return;
      }

      const stopTime = new Date();

      // Stop all mechanics' activities and calculate work time
      const updatePromises = activity.mechanics.map(async (mechanic) => {
        // Skip if already completed
        if (mechanic.status === "COMPLETED" || mechanic.stoppedAt) {
          return null;
        }

        // Skip if not started
        if (!mechanic.startedAt) {
          return null;
        }

        // Calculate total work time from tasks if available
        let totalWorkTime = 0;

        if (mechanic.tasks.length > 0) {
          // Stop all running tasks first
          const stopTaskPromises = mechanic.tasks.map(async (task) => {
            if (task.startedAt && !task.stoppedAt) {
              return this.prisma.task.update({
                where: { id: task.id },
                data: { stoppedAt: stopTime },
              });
            }
            return null;
          });

          await Promise.all(stopTaskPromises);

          // Calculate total time from all tasks
          const allTasks = await this.prisma.task.findMany({
            where: { activityMechanicId: mechanic.id },
          });

          for (const task of allTasks) {
            if (task.startedAt) {
              const taskStopTime = task.stoppedAt || stopTime;
              const taskDuration = Math.floor(
                (taskStopTime.getTime() - task.startedAt.getTime()) / 60000,
              );
              totalWorkTime += taskDuration;
            }
          }
        } else {
          // Calculate from assignment start/stop time
          const baseTime = stopTime.getTime() - mechanic.startedAt.getTime();
          totalWorkTime = Math.floor(baseTime / 60000);

          if (mechanic.pausedAt) {
            const pauseTime = Math.floor(
              (stopTime.getTime() - mechanic.pausedAt.getTime()) / 60000,
            );
            totalWorkTime -= pauseTime;
          }
        }

        // Update mechanic assignment
        return this.prisma.activityMechanic.update({
          where: { id: mechanic.id },
          data: {
            status: "COMPLETED",
            stoppedAt: stopTime,
            totalWorkTime: totalWorkTime > 0 ? totalWorkTime : 0,
          },
        });
      });

      await Promise.all(updatePromises);

      // Update main activity status to COMPLETED
      await this.prisma.mechanicActivity.update({
        where: { id: activityId },
        data: {
          activityStatus: "COMPLETED",
        },
      });

      // Fetch updated activity
      const updatedActivity = await this.prisma.mechanicActivity.findUnique({
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

      res.status(200).json({
        success: true,
        message: "Activity stopped for all mechanics successfully",
        data: updatedActivity,
      });
    } catch (error) {
      console.error("Stop activity for all mechanics error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  // Start task for a specific mechanic (group leader can control any mechanic's tasks)
  // NOTE: When starting a task for one mechanic, the same task will be started
  // for ALL mechanics assigned to the same activity (if valid for them).
  async startMechanicTask(req: Request, res: Response): Promise<void> {
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
      if (
        userPosisi !== "GROUP_LEADER_MEKANIK" &&
        userPosisi !== "GROUP_LEADER_TYRE" &&
        req.user?.role !== "ADMIN" &&
        req.user?.role !== "SUPERADMIN"
      ) {
        res.status(403).json({
          success: false,
          message: "Only Group Leaders can start tasks",
        });
        return;
      }

      const { activityId, mechanicId } = req.params;
      const { taskName } = req.body;
      const id = Array.isArray(activityId) ? activityId[0] : activityId;
      const mechId = Array.isArray(mechanicId) ? mechanicId[0] : mechanicId;

      // Get all mechanic assignments for this activity
      const allAssignments = await this.prisma.activityMechanic.findMany({
        where: {
          activityId: id,
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

      const assignment = allAssignments.find(
        (a) => a.mechanicId === mechId,
      );

      if (!assignment) {
        res.status(404).json({
          success: false,
          message: "Activity assignment not found for this mechanic",
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
          message: `Invalid taskName for ${activityName}. Valid names are: ${validTaskNames.join(
            ", ",
          )}`,
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
      const taskOrder: Record<string, number> = {};
      taskSequence.forEach((task) => {
        taskOrder[task.taskName] = task.order;
      });

      const currentTaskOrder = taskOrder[taskName];

      // Helper to check previous tasks completed for a given assignment
      const ensurePreviousTasksCompleted = (a: any) => {
        for (let i = 1; i < currentTaskOrder; i++) {
          const prevTaskName = Object.keys(taskOrder).find(
            (key) => taskOrder[key] === i,
          );
          const prevTask = a.tasks.find(
            (t: any) => t.taskName === prevTaskName,
          );
          if (!prevTask || !prevTask.stoppedAt) {
            throw new Error(
              `Please complete ${prevTaskName?.replace(/_/g, " ")} first`,
            );
          }
        }
      };

      const startTime = new Date();

      // Start the task for ALL mechanics assigned to this activity
      for (const a of allAssignments) {
        // Only affect mechanics whose activity is in progress
        if (!a.startedAt || a.status !== "IN_PROGRESS") {
          continue;
        }

        // Reuse validation for each mechanic
        ensurePreviousTasksCompleted(a);

        const existingTaskForMech = a.tasks.find(
          (t: any) => t.taskName === taskName,
        );

        // If task already started for this mechanic, skip it
        if (existingTaskForMech && existingTaskForMech.startedAt) {
          continue;
        }

        if (existingTaskForMech) {
          await this.prisma.task.update({
            where: { id: existingTaskForMech.id },
            data: {
              startedAt: startTime,
            },
          });
        } else {
          await this.prisma.task.create({
            data: {
              activityMechanicId: a.id,
              taskName: taskName as any,
              order: currentTaskOrder,
              startedAt: startTime,
            },
          });
        }
      }

      // Return updated activity with mechanics and tasks
      const updatedActivity = await this.prisma.mechanicActivity.findUnique({
        where: { id },
        include: {
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
          unit: {
            select: {
              id: true,
              unitCode: true,
              unitType: true,
              unitBrand: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: "Task started successfully for all mechanics",
        data: updatedActivity,
      });
    } catch (error) {
      console.error("Start mechanic task error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  // Stop task for a specific mechanic (group leader can control any mechanic's tasks)
  // NOTE: When stopping a task for one mechanic, the same task will be stopped
  // for ALL mechanics assigned to the same activity (if it is running for them).
  async stopMechanicTask(req: Request, res: Response): Promise<void> {
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
      if (
        userPosisi !== "GROUP_LEADER_MEKANIK" &&
        userPosisi !== "GROUP_LEADER_TYRE" &&
        req.user?.role !== "ADMIN" &&
        req.user?.role !== "SUPERADMIN"
      ) {
        res.status(403).json({
          success: false,
          message: "Only Group Leaders can stop tasks",
        });
        return;
      }

      const { activityId, mechanicId } = req.params;
      const { taskName } = req.body;
      const id = Array.isArray(activityId) ? activityId[0] : activityId;
      const mechId = Array.isArray(mechanicId) ? mechanicId[0] : mechanicId;

      // Get all mechanic assignments for this activity
      const allAssignments = await this.prisma.activityMechanic.findMany({
        where: {
          activityId: id,
        },
        include: {
          activity: true,
          tasks: true,
        },
      });

      const assignment = allAssignments.find(
        (a) => a.mechanicId === mechId,
      );

      if (!assignment) {
        res.status(404).json({
          success: false,
          message: "Activity assignment not found for this mechanic",
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
          message: `Invalid taskName for ${activityName}. Valid names are: ${validTaskNames.join(
            ", ",
          )}`,
        });
        return;
      }

      const stopTime = new Date();

      // For each mechanic assignment on this activity, stop the task if it is running,
      // and update assignment status/totalWorkTime when all tasks are completed.
      for (const a of allAssignments) {
        const taskForMech = a.tasks.find((t: any) => t.taskName === taskName);

        // If task doesn't exist or hasn't started, skip this mechanic
        if (!taskForMech || !taskForMech.startedAt || taskForMech.stoppedAt) {
          continue;
        }

        // Stop the task
        await this.prisma.task.update({
          where: { id: taskForMech.id },
          data: {
            stoppedAt: stopTime,
          },
        });

        // Check if all tasks for this mechanic are completed
        const allTasks = await this.prisma.task.findMany({
          where: { activityMechanicId: a.id },
          orderBy: {
            order: "asc",
          },
        });

        const allTasksCompleted =
          allTasks.length > 0 &&
          allTasks.every((t) => t.startedAt && t.stoppedAt);

        if (allTasksCompleted) {
          let totalWorkTime = 0;
          for (const t of allTasks) {
            if (t.startedAt) {
              const taskStopTime = t.stoppedAt || stopTime;
              const taskDuration = Math.floor(
                (taskStopTime.getTime() - t.startedAt.getTime()) / 60000,
              );
              totalWorkTime += taskDuration;
            }
          }

          await this.prisma.activityMechanic.update({
            where: { id: a.id },
            data: {
              status: "COMPLETED",
              stoppedAt: stopTime,
              totalWorkTime: totalWorkTime > 0 ? totalWorkTime : 0,
            },
          });
        }
      }

      // Return updated activity with mechanics and tasks
      const updatedActivity = await this.prisma.mechanicActivity.findUnique({
        where: { id },
        include: {
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
          unit: {
            select: {
              id: true,
              unitCode: true,
              unitType: true,
              unitBrand: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: "Task stopped successfully for all mechanics",
        data: updatedActivity,
      });
    } catch (error) {
      console.error("Stop mechanic task error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }
}
