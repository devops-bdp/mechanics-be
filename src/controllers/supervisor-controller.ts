import { Request, Response } from "express";
import { PrismaClient, TaskName } from "@prisma/client";

export class SupervisorController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
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
      const invalidMechanics = mechanics.filter(
        (m) => !validPosisis.includes(m.posisi)
      );

      if (invalidMechanics.length > 0) {
        res.status(400).json({
          success: false,
          message: `Invalid posisi. Only MEKANIK, ELECTRICIAN, WELDER, and TYREMAN can be assigned.`,
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
      const mechanics = await this.prisma.user.findMany({
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

