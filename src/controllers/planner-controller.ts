import { Request, Response } from "express";
import { PrismaClient, TaskName } from "@prisma/client";

export class PlannerController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Helper function to format duration (only show relevant parts)
  private formatDuration(
    hours: number,
    minutes: number,
    seconds: number,
    isRunning: boolean = false
  ): string {
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
          message: `Invalid activityName. Valid names are: ${validActivityNames.join(
            ", "
          )}`,
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
          message: `Invalid activityStatus. Valid statuses are: ${validStatuses.join(
            ", "
          )}`,
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

      // Check if unit status is BREAKDOWN or INACTIVE (planner can only create activity for BREAKDOWN or INACTIVE units)
      if (unit.unitStatus !== "BREAKDOWN" && unit.unitStatus !== "INACTIVE") {
        res.status(400).json({
          success: false,
          message: `Cannot create activity for unit with status ${unit.unitStatus}. Unit must be in BREAKDOWN or INACTIVE status. Please change the unit status first.`,
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
              durationFormatted = this.formatDuration(
                hours,
                minutes,
                seconds,
                true
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
            totalSeconds
          );
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
            durationFormatted = this.formatDuration(
              hours,
              minutes,
              seconds,
              true
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
          totalSeconds
        );
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
            message: `Invalid activityName. Valid names are: ${validActivityNames.join(
              ", "
            )}`,
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
            message: `Invalid activityStatus. Valid statuses are: ${validStatuses.join(
              ", "
            )}`,
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
      if (activityStatus !== undefined)
        updateData.activityStatus = activityStatus;
      if (estimatedStart !== undefined)
        updateData.estimatedStart = new Date(estimatedStart);
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

  // Get unit activities report - shows all units with their associated activities (regardless of unit status)
  async getBreakdownUnitsReport(req: Request, res: Response): Promise<void> {
    try {
      // Get all units that have activities (regardless of unit status)
      const unitsWithActivities = await this.prisma.unit.findMany({
        where: {
          activities: {
            some: {}, // At least one activity exists
          },
        },
        include: {
          activities: {
            select: {
              id: true,
              activityName: true,
              activityStatus: true,
              estimatedStart: true,
              createdAt: true,
              updatedAt: true,
              description: true,
              remarks: true,
              mechanics: {
                select: {
                  id: true,
                  status: true,
                  stoppedAt: true,
                  updatedAt: true,
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
                    select: {
                      id: true,
                      startedAt: true,
                      stoppedAt: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          unitCode: "asc",
        },
      });

      // Format the response - only include units that have activities
      const report = unitsWithActivities
        .filter((unit) => unit.activities.length > 0)
        .map((unit) => ({
          id: unit.id,
          unitCode: unit.unitCode,
          unitType: unit.unitType,
          unitBrand: unit.unitBrand,
          unitDescription: unit.unitDescription,
          unitImage: unit.unitImage,
          unitStatus: unit.unitStatus,
          createdAt: unit.createdAt,
          updatedAt: unit.updatedAt,
          activities: unit.activities.map((activity) => {
            // Calculate total time per mechanic and average
            const mechanicTimes: number[] = [];
            let completedOn: Date | null = null;

            activity.mechanics.forEach((mechanic) => {
              // Calculate total time for this mechanic from all tasks
              let mechanicTotalSeconds = 0;

              mechanic.tasks.forEach((task) => {
                if (task.startedAt && task.stoppedAt) {
                  mechanicTotalSeconds += Math.floor(
                    (task.stoppedAt.getTime() - task.startedAt.getTime()) / 1000
                  );
                } else if (task.startedAt && !task.stoppedAt) {
                  // Task in progress - calculate current duration
                  const now = new Date();
                  mechanicTotalSeconds += Math.floor(
                    (now.getTime() - task.startedAt.getTime()) / 1000
                  );
                }
              });

              if (mechanicTotalSeconds > 0) {
                mechanicTimes.push(mechanicTotalSeconds);
              }

              // Get completed date - use stoppedAt if available, otherwise use updatedAt if status is COMPLETED
              if (mechanic.status === "COMPLETED") {
                const mechanicCompletedDate =
                  mechanic.stoppedAt || mechanic.updatedAt;
                if (mechanicCompletedDate) {
                  if (
                    !completedOn ||
                    mechanicCompletedDate.getTime() > completedOn.getTime()
                  ) {
                    completedOn = mechanicCompletedDate;
                  }
                }
              }
            });

            // Calculate average time in seconds
            const avgTotalSeconds =
              mechanicTimes.length > 0
                ? mechanicTimes.reduce((sum, time) => sum + time, 0) /
                  mechanicTimes.length
                : 0;

            const avgHours = Math.floor(avgTotalSeconds / 3600);
            const avgMinutes = Math.floor((avgTotalSeconds % 3600) / 60);
            const avgSeconds = Math.floor(avgTotalSeconds % 60);
            const avgTimeFormatted = this.formatDuration(
              avgHours,
              avgMinutes,
              avgSeconds
            );

            return {
              id: activity.id,
              activityName: activity.activityName,
              activityStatus: activity.activityStatus,
              estimatedStart: activity.estimatedStart,
              createdAt: activity.createdAt,
              updatedAt: activity.updatedAt,
              description: activity.description,
              remarks: activity.remarks,
              completedOn: completedOn,
              totalActivityTimeSeconds: Math.floor(avgTotalSeconds),
              totalActivityTimeFormatted: avgTimeFormatted,
              assignedMechanics: activity.mechanics.map((am) => ({
                id: am.mechanic.id,
                firstName: am.mechanic.firstName,
                lastName: am.mechanic.lastName,
                nrp: am.mechanic.nrp,
                email: am.mechanic.email,
                status: am.status,
              })),
            };
          }),
        }));

      res.status(200).json({
        success: true,
        data: report,
        total: report.length,
      });
    } catch (error: any) {
      console.error("Error fetching unit activities report:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch unit activities report",
        error: error.message,
      });
    }
  }

  // Get mechanics report - shows mechanics with their activities, tasks, and time spent
  async getMechanicsReport(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;

      // Get all mechanics (users with MEKANIK position)
      // If search is provided, filter mechanics by name or NRP
      const mechanicWhere: any = {
        posisi: "MEKANIK",
      };

      if (search) {
        const searchValue = Array.isArray(search) ? search[0] : search;
        if (
          searchValue &&
          typeof searchValue === "string" &&
          searchValue.trim() !== ""
        ) {
          mechanicWhere.OR = [
            {
              firstName: {
                contains: searchValue,
                mode: "insensitive",
              },
            },
            {
              lastName: {
                contains: searchValue,
                mode: "insensitive",
              },
            },
            {
              nrp: {
                equals: parseInt(searchValue) || -1,
              },
            },
          ];
        }
      }

      const mechanics = await this.prisma.user.findMany({
        where: mechanicWhere,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nrp: true,
          email: true,
        },
        orderBy: {
          firstName: "asc",
        },
      });

      // Build where clause for activity assignments
      const assignmentWhere: any = {
        mechanicId: {
          in: mechanics.map((m) => m.id),
        },
      };

      // Get all activity assignments for these mechanics with tasks
      const activityAssignments = await this.prisma.activityMechanic.findMany({
        where: assignmentWhere,
        include: {
          activity: {
            select: {
              id: true,
              activityName: true,
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
        orderBy: {
          createdAt: "desc",
        },
      });

      // Additional filtering for search (unit code, activity name)
      let filteredAssignments = activityAssignments;
      if (search) {
        const searchValueRaw = Array.isArray(search) ? search[0] : search;
        const searchValue =
          typeof searchValueRaw === "string"
            ? searchValueRaw.toLowerCase()
            : String(searchValueRaw).toLowerCase();
        filteredAssignments = activityAssignments.filter((assignment) => {
          const unitCode = assignment.activity.unit.unitCode.toLowerCase();
          const activityName = assignment.activity.activityName
            .toLowerCase()
            .replace(/_/g, " ");
          return (
            unitCode.includes(searchValue) || activityName.includes(searchValue)
          );
        });
      }

      // Format the response - group by mechanic
      const report = mechanics.map((mechanic) => {
        const assignments = filteredAssignments.filter(
          (aa) => aa.mechanicId === mechanic.id
        );

        const activities = assignments.map((assignment) => {
          // Calculate time for each task
          const tasksWithTime = assignment.tasks.map((task) => {
            let durationSeconds = 0;
            let isActive = false;

            if (task.startedAt && task.stoppedAt) {
              // Task completed
              durationSeconds = Math.floor(
                (task.stoppedAt.getTime() - task.startedAt.getTime()) / 1000
              );
            } else if (task.startedAt && !task.stoppedAt) {
              // Task in progress
              const now = new Date();
              durationSeconds = Math.floor(
                (now.getTime() - task.startedAt.getTime()) / 1000
              );
              isActive = true;
            }

            const hours = Math.floor(durationSeconds / 3600);
            const minutes = Math.floor((durationSeconds % 3600) / 60);
            const seconds = durationSeconds % 60;
            const durationFormatted = this.formatDuration(
              hours,
              minutes,
              seconds,
              isActive
            );

            return {
              id: task.id,
              taskName: task.taskName,
              order: task.order,
              startedAt: task.startedAt,
              stoppedAt: task.stoppedAt,
              durationSeconds,
              durationFormatted,
              isActive,
            };
          });

          // Calculate total time for this activity (sum of all tasks)
          const totalActivitySeconds = tasksWithTime.reduce(
            (sum, task) => sum + task.durationSeconds,
            0
          );
          const totalHours = Math.floor(totalActivitySeconds / 3600);
          const totalMinutes = Math.floor((totalActivitySeconds % 3600) / 60);
          const totalSeconds = totalActivitySeconds % 60;
          const totalActivityTimeFormatted = this.formatDuration(
            totalHours,
            totalMinutes,
            totalSeconds
          );

          return {
            id: assignment.id,
            activityId: assignment.activity.id,
            activityName: assignment.activity.activityName,
            unitCode: assignment.activity.unit.unitCode,
            unitType: assignment.activity.unit.unitType,
            unitBrand: assignment.activity.unit.unitBrand,
            status: assignment.status,
            startedAt: assignment.startedAt,
            stoppedAt: assignment.stoppedAt,
            createdAt: assignment.createdAt,
            tasks: tasksWithTime,
            totalActivitySeconds,
            totalActivityTimeFormatted,
          };
        });

        // Calculate total time across all activities for this mechanic
        const totalMechanicSeconds = activities.reduce(
          (sum, activity) => sum + activity.totalActivitySeconds,
          0
        );
        const totalMechanicHours = Math.floor(totalMechanicSeconds / 3600);
        const totalMechanicMinutes = Math.floor(
          (totalMechanicSeconds % 3600) / 60
        );
        const totalMechanicSecs = totalMechanicSeconds % 60;
        const totalMechanicTimeFormatted = this.formatDuration(
          totalMechanicHours,
          totalMechanicMinutes,
          totalMechanicSecs
        );

        return {
          id: mechanic.id,
          firstName: mechanic.firstName,
          lastName: mechanic.lastName,
          nrp: mechanic.nrp,
          email: mechanic.email,
          activities,
          totalActivities: activities.length,
          totalMechanicSeconds,
          totalMechanicTimeFormatted,
        };
      });

      res.status(200).json({
        success: true,
        data: report,
        total: report.length,
      });
    } catch (error: any) {
      console.error("Error fetching mechanics report:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch mechanics report",
        error: error.message,
      });
    }
  }

  // Get activity analytics - shows activity distribution by status and type
  async getActivityAnalytics(req: Request, res: Response): Promise<void> {
    try {
      // Get activity distribution by status
      const activitiesByStatus = await this.prisma.mechanicActivity.groupBy({
        by: ["activityStatus"],
        _count: {
          id: true,
        },
      });

      // Get activity distribution by activity name
      const activitiesByType = await this.prisma.mechanicActivity.groupBy({
        by: ["activityName"],
        _count: {
          id: true,
        },
      });

      // Get activities created in last 6 months (monthly)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const activities = await this.prisma.mechanicActivity.findMany({
        where: {
          createdAt: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          createdAt: true,
          activityStatus: true,
        },
      });

      // Group by month
      const monthlyData: Record<
        string,
        { month: string; count: number; completed: number }
      > = {};
      activities.forEach((activity) => {
        const date = new Date(activity.createdAt);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        const monthName = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthName,
            count: 0,
            completed: 0,
          };
        }
        monthlyData[monthKey].count++;
        if (activity.activityStatus === "COMPLETED") {
          monthlyData[monthKey].completed++;
        }
      });

      const monthlyTrend = Object.values(monthlyData).sort((a, b) => {
        const aDate = new Date(a.month);
        const bDate = new Date(b.month);
        return aDate.getTime() - bDate.getTime();
      });

      res.status(200).json({
        success: true,
        data: {
          byStatus: activitiesByStatus.map((item) => ({
            status: item.activityStatus,
            count: item._count.id,
          })),
          byType: activitiesByType.map((item) => ({
            activityName: item.activityName,
            count: item._count.id,
          })),
          monthlyTrend,
        },
      });
    } catch (error: any) {
      console.error("Error fetching activity analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch activity analytics",
        error: error.message,
      });
    }
  }

  // Get unit analytics - shows unit distribution by status and type
  async getUnitAnalytics(req: Request, res: Response): Promise<void> {
    try {
      // Get unit distribution by status
      const unitsByStatus = await this.prisma.unit.groupBy({
        by: ["unitStatus"],
        _count: {
          id: true,
        },
      });

      // Get unit distribution by type
      const unitsByType = await this.prisma.unit.groupBy({
        by: ["unitType"],
        _count: {
          id: true,
        },
      });

      // Get unit distribution by brand
      const unitsByBrand = await this.prisma.unit.groupBy({
        by: ["unitBrand"],
        _count: {
          id: true,
        },
      });

      // Get units with activity count
      const unitsWithActivities = await this.prisma.unit.findMany({
        include: {
          _count: {
            select: {
              activities: true,
            },
          },
        },
      });

      // Group by activity count ranges
      const activityCountRanges = {
        "0": 0,
        "1-5": 0,
        "6-10": 0,
        "11-20": 0,
        "21+": 0,
      };

      unitsWithActivities.forEach((unit) => {
        const count = unit._count.activities;
        if (count === 0) {
          activityCountRanges["0"]++;
        } else if (count >= 1 && count <= 5) {
          activityCountRanges["1-5"]++;
        } else if (count >= 6 && count <= 10) {
          activityCountRanges["6-10"]++;
        } else if (count >= 11 && count <= 20) {
          activityCountRanges["11-20"]++;
        } else {
          activityCountRanges["21+"]++;
        }
      });

      res.status(200).json({
        success: true,
        data: {
          byStatus: unitsByStatus.map((item) => ({
            status: item.unitStatus,
            count: item._count.id,
          })),
          byType: unitsByType.map((item) => ({
            unitType: item.unitType,
            count: item._count.id,
          })),
          byBrand: unitsByBrand.map((item) => ({
            unitBrand: item.unitBrand,
            count: item._count.id,
          })),
          byActivityCount: Object.entries(activityCountRanges).map(
            ([range, count]) => ({
              range,
              count,
            })
          ),
        },
      });
    } catch (error: any) {
      console.error("Error fetching unit analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch unit analytics",
        error: error.message,
      });
    }
  }

  // Get mechanics analytics - shows top mechanics by activity count and work time
  async getMechanicsAnalytics(req: Request, res: Response): Promise<void> {
    try {
      // Get all mechanics with their activity assignments
      const mechanics = await this.prisma.user.findMany({
        where: {
          posisi: "MEKANIK",
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nrp: true,
        },
      });

      // Get all activity assignments for these mechanics with tasks
      const activityAssignments = await this.prisma.activityMechanic.findMany({
        where: {
          mechanicId: {
            in: mechanics.map((m) => m.id),
          },
        },
        include: {
          tasks: {
            select: {
              startedAt: true,
              stoppedAt: true,
            },
          },
        },
      });

      // Calculate statistics for each mechanic
      const mechanicStats = mechanics.map((mechanic) => {
        const assignments = activityAssignments.filter(
          (aa) => aa.mechanicId === mechanic.id
        );

        // Count total activities
        const totalActivities = assignments.length;

        // Calculate total work time from all tasks
        let totalWorkTimeSeconds = 0;
        assignments.forEach((assignment) => {
          assignment.tasks.forEach((task) => {
            if (task.startedAt && task.stoppedAt) {
              const duration = Math.floor(
                (task.stoppedAt.getTime() - task.startedAt.getTime()) / 1000
              );
              totalWorkTimeSeconds += duration;
            } else if (task.startedAt && !task.stoppedAt) {
              // Task is currently active
              const duration = Math.floor(
                (new Date().getTime() - task.startedAt.getTime()) / 1000
              );
              totalWorkTimeSeconds += duration;
            }
          });
        });

        const hours = Math.floor(totalWorkTimeSeconds / 3600);
        const minutes = Math.floor((totalWorkTimeSeconds % 3600) / 60);
        const seconds = totalWorkTimeSeconds % 60;
        const totalWorkTimeFormatted = this.formatDuration(
          hours,
          minutes,
          seconds
        );

        return {
          id: mechanic.id,
          name: `${mechanic.firstName} ${mechanic.lastName}`,
          nrp: mechanic.nrp,
          totalActivities,
          totalWorkTimeSeconds,
          totalWorkTimeFormatted,
        };
      });

      // Sort by activity count (descending) - top 10
      const topByActivities = mechanicStats
        .sort((a, b) => b.totalActivities - a.totalActivities)
        .slice(0, 10)
        .map((mechanic, index) => ({
          ...mechanic,
          rank: index + 1,
        }));

      // Sort by work time (descending) - top 10
      const topByWorkTime = mechanicStats
        .sort((a, b) => b.totalWorkTimeSeconds - a.totalWorkTimeSeconds)
        .slice(0, 10)
        .map((mechanic, index) => ({
          ...mechanic,
          rank: index + 1,
        }));

      res.status(200).json({
        success: true,
        data: {
          topByActivities,
          topByWorkTime,
        },
      });
    } catch (error: any) {
      console.error("Error fetching mechanics analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch mechanics analytics",
        error: error.message,
      });
    }
  }
}
