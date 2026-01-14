import { Request, Response } from "express";
import { PrismaClient, TaskName } from "@prisma/client";

export class PlannerController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Helper function to format duration (only show relevant parts)
  private formatDuration(hours: number, minutes: number, seconds: number, isRunning: boolean = false): string {
    const parts: string[] = [];
    
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }
    if (seconds > 0 || parts.length === 0) {
      parts.push(`${seconds}s`);
    }
    
    const formatted = parts.join(" ");
    return isRunning ? `${formatted} (running)` : formatted;
  }

  // Get task sequence for each activity type
  private getTaskSequence(
    activityName: string
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

  async createActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const {
        activityName,
        unitId,
        description,
        remarks,
        estimatedStart,
        activityStatus = "PENDING",
      } = req.body;

      // Validation
      if (!activityName || !unitId || !estimatedStart) {
        res.status(400).json({
          success: false,
          message:
            "Missing required fields: activityName, unitId, estimatedStart",
        });
        return;
      }

      // Validate activityName
      const validActivityNames = [
        "PERIODIC_SERVICE",
        "SCHEDULED_MAINTENANCE",
        "UNSCHEDULED_MAINTENANCE",
        "TROUBLESHOOTING",
        "REPAIR_AND_ADJUSTMENT",
        "GENERAL_REPAIR",
        "PERIODIC_INSPECTION",
        "PERIODIC_INSPECTION_TYRE",
        "PERIODIC_SERVICE_TYRE",
        "RETORQUE_TYRE",
        "REPAIR_TYRE",
        "TROUBLESHOOTING_TYRE",
        "OTHER",
      ];
      if (!validActivityNames.includes(activityName)) {
        res.status(400).json({
          success: false,
          message: `Invalid activityName. Valid names are: ${validActivityNames.join(", ")}`,
        });
        return;
      }

      // Validate activityStatus
      const validStatuses = [
        "PENDING",
        "OPEN",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "DELAYED",
      ];
      if (activityStatus && !validStatuses.includes(activityStatus)) {
        res.status(400).json({
          success: false,
          message: `Invalid activityStatus. Valid statuses are: ${validStatuses.join(", ")}`,
        });
        return;
      }

      // Validate estimatedStart date
      const estimatedStartDate = new Date(estimatedStart);

      if (isNaN(estimatedStartDate.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid estimatedStart date format",
        });
        return;
      }

      // Check if unit exists
      const unit = await this.prisma.unit.findUnique({
        where: { id: unitId },
      });

      if (!unit) {
        res.status(404).json({
          success: false,
          message: "Unit not found",
        });
        return;
      }

      // Create activity without mechanics (assignment will be done by GROUP_LEADER or SUPERVISOR)
      const activity = await this.prisma.mechanicActivity.create({
        data: {
          activityName: activityName as any,
          unitId,
          description,
          remarks,
          activityStatus: activityStatus as any,
          estimatedStart: estimatedStartDate,
          createdBy: userId,
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

      res.status(201).json({
        success: true,
        message: "Activity created successfully",
        data: activity,
      });
    } catch (error) {
      console.error("Create activity error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
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

      // Build where clause
      const where: any = {};
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
              durationSeconds = Math.floor(
                (task.stoppedAt.getTime() - task.startedAt.getTime()) / 1000
              );
              const hours = Math.floor(durationSeconds / 3600);
              const minutes = Math.floor((durationSeconds % 3600) / 60);
              const seconds = durationSeconds % 60;
              durationFormatted = this.formatDuration(hours, minutes, seconds);
            } else if (task.startedAt && !task.stoppedAt) {
              // Task in progress - calculate current duration
              const now = new Date();
              durationSeconds = Math.floor(
                (now.getTime() - task.startedAt.getTime()) / 1000
              );
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
          const totalTaskTimeSeconds = tasksWithDuration.reduce(
            (sum, task) => {
              // Calculate seconds from durationMinutes
              return sum + (task.durationMinutes * 60);
            },
            0
          );
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

      // Calculate task durations and format response
      const mechanicsWithTaskTime = activity.mechanics.map((mechanic) => {
        const tasksWithDuration = mechanic.tasks.map((task) => {
          let durationSeconds = 0;
          let durationFormatted = "0h 0m 0s";
          let isActive = false;

          if (task.startedAt && task.stoppedAt) {
            // Task completed - calculate duration
            durationSeconds = Math.floor(
              (task.stoppedAt.getTime() - task.startedAt.getTime()) / 1000
            );
            const hours = Math.floor(durationSeconds / 3600);
            const minutes = Math.floor((durationSeconds % 3600) / 60);
            const seconds = durationSeconds % 60;
            durationFormatted = this.formatDuration(hours, minutes, seconds);
          } else if (task.startedAt && !task.stoppedAt) {
            // Task in progress - calculate current duration
            const now = new Date();
            durationSeconds = Math.floor(
              (now.getTime() - task.startedAt.getTime()) / 1000
            );
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
        const totalTaskTimeSeconds = tasksWithDuration.reduce(
          (sum, task) => {
            // Calculate seconds from durationMinutes
            return sum + (task.durationMinutes * 60);
          },
          0
        );
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

      const activityWithTaskTime = {
        ...activity,
        mechanics: mechanicsWithTaskTime,
      };

      res.status(200).json({
        success: true,
        message: "Activity retrieved successfully",
        data: activityWithTaskTime,
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

      const {
        activityName,
        unitId,
        description,
        remarks,
        activityStatus,
        estimatedStart,
      } = req.body;

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

      // Validate activityName if provided
      if (activityName) {
        const validActivityNames = [
          "PERIODIC_SERVICE",
          "SCHEDULED_MAINTENANCE",
          "UNSCHEDULED_MAINTENANCE",
          "TROUBLESHOOTING",
          "REPAIR_AND_ADJUSTMENT",
          "GENERAL_REPAIR",
          "PERIODIC_INSPECTION",
          "PERIODIC_INSPECTION_TYRE",
          "PERIODIC_SERVICE_TYRE",
          "RETORQUE_TYRE",
          "REPAIR_TYRE",
          "TROUBLESHOOTING_TYRE",
          "OTHER",
        ];
        if (!validActivityNames.includes(activityName)) {
          res.status(400).json({
            success: false,
            message: `Invalid activityName. Valid names are: ${validActivityNames.join(", ")}`,
          });
          return;
        }
      }

      // Validate activityStatus if provided
      if (activityStatus) {
        const validStatuses = [
          "PENDING",
          "OPEN",
          "IN_PROGRESS",
          "COMPLETED",
          "CANCELLED",
          "DELAYED",
        ];
        if (!validStatuses.includes(activityStatus)) {
          res.status(400).json({
            success: false,
            message: `Invalid activityStatus. Valid statuses are: ${validStatuses.join(", ")}`,
          });
          return;
        }
      }

      // Check unit if provided
      if (unitId) {
        const unit = await this.prisma.unit.findUnique({
          where: { id: unitId },
        });
        if (!unit) {
          res.status(404).json({
            success: false,
            message: "Unit not found",
          });
          return;
        }
      }

      // Validate estimatedStart date if provided
      if (estimatedStart) {
        const estimatedStartDate = new Date(estimatedStart);

        if (isNaN(estimatedStartDate.getTime())) {
          res.status(400).json({
            success: false,
            message: "Invalid estimatedStart date format",
          });
          return;
        }
      }

      // Build update data
      const updateData: any = {};
      if (activityName !== undefined) updateData.activityName = activityName;
      if (unitId !== undefined) updateData.unitId = unitId;
      if (description !== undefined) updateData.description = description;
      if (remarks !== undefined) updateData.remarks = remarks;
      if (activityStatus !== undefined) updateData.activityStatus = activityStatus;
      if (estimatedStart !== undefined) updateData.estimatedStart = new Date(estimatedStart);
      updateData.updatedBy = userId;

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          message: "No fields to update",
        });
        return;
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

  async getMechanics(req: Request, res: Response): Promise<void> {
    try {
      // Get all users with MEKANIK posisi
      const mechanics = await this.prisma.user.findMany({
        where: {
          posisi: "MEKANIK",
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          nrp: true,
          phoneNumber: true,
        },
        orderBy: {
          firstName: "asc",
        },
      });

      res.status(200).json({
        success: true,
        message: "Mechanics retrieved successfully",
        data: mechanics,
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
}

