import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { UnitType, UnitBrand, UnitStatus } from "@prisma/client";

export class UnitController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  async create(req: Request, res: Response): Promise<void> {
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
        unitType,
        unitBrand,
        unitCode,
        unitDescription,
        unitImage,
        unitStatus = UnitStatus.ACTIVE,
      } = req.body;

      // Validation
      if (!unitType || !unitBrand || !unitCode) {
        res.status(400).json({
          success: false,
          message: "Missing required fields: unitType, unitBrand, unitCode",
        });
        return;
      }

      // Validate unitType
      const validUnitTypes = Object.values(UnitType);
      if (!validUnitTypes.includes(unitType as UnitType)) {
        res.status(400).json({
          success: false,
          message: `Invalid unitType. Valid types are: ${validUnitTypes.join(
            ", ",
          )}`,
        });
        return;
      }

      // Validate unitBrand
      const validUnitBrands = Object.values(UnitBrand);
      if (!validUnitBrands.includes(unitBrand as UnitBrand)) {
        res.status(400).json({
          success: false,
          message: `Invalid unitBrand. Valid brands are: ${validUnitBrands.join(
            ", ",
          )}`,
        });
        return;
      }

      // Validate unitStatus if provided
      if (unitStatus) {
        const validStatuses = Object.values(UnitStatus);
        if (!validStatuses.includes(unitStatus as UnitStatus)) {
          res.status(400).json({
            success: false,
            message: `Invalid unitStatus. Valid statuses are: ${validStatuses.join(
              ", ",
            )}`,
          });
          return;
        }
      }

      // Check if unitCode already exists
      const existingUnit = await this.prisma.unit.findUnique({
        where: { unitCode },
      });

      if (existingUnit) {
        res.status(409).json({
          success: false,
          message: "Unit with this code already exists",
        });
        return;
      }

      // Create unit
      const unit = await this.prisma.unit.create({
        data: {
          unitType: unitType as UnitType,
          unitBrand: unitBrand as UnitBrand,
          unitCode,
          unitDescription,
          unitImage,
          unitStatus: unitStatus as UnitStatus,
          createdBy: userId,
        },
      });

      res.status(201).json({
        success: true,
        message: "Unit created successfully",
        data: unit,
      });
    } catch (error) {
      console.error("Create unit error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const {
        status,
        type,
        brand,
        search,
        page = "1",
        limit = "10",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // Parse pagination parameters
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

      if (limitNumber < 1 || limitNumber > 1000) {
        res.status(400).json({
          success: false,
          message: "Limit must be between 1 and 1000",
        });
        return;
      }

      // Build where clause
      const where: any = {};
      if (status) {
        const statusValue = Array.isArray(status) ? status[0] : status;
        where.unitStatus = statusValue;
      }
      if (type) {
        const typeValue = Array.isArray(type) ? type[0] : type;
        where.unitType = typeValue;
      }
      if (brand) {
        const brandValue = Array.isArray(brand) ? brand[0] : brand;
        where.unitBrand = brandValue;
      }

      // Search filter (search in unitCode and unitDescription)
      if (search) {
        const searchValue = Array.isArray(search) ? search[0] : search;
        where.OR = [
          {
            unitCode: {
              contains: searchValue as string,
              mode: "insensitive",
            },
          },
          {
            unitDescription: {
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
        "unitCode",
        "unitType",
        "unitBrand",
        "unitStatus",
      ];
      const sortField = validSortFields.includes(sortBy as string)
        ? (sortBy as string)
        : "createdAt";

      // Validate sortOrder
      const order = sortOrder === "asc" ? "asc" : "desc";

      // Get total count for pagination
      const totalCount = await this.prisma.unit.count({ where });

      // For custom unitCode sorting, we need to fetch all matching units first,
      // sort them, then paginate. For other fields, use normal Prisma sorting.
      let units: any[];

      if (sortField === "unitCode") {
        // Fetch all matching units for custom sorting
        const allUnits = await this.prisma.unit.findMany({
          where,
        });

        // Custom sorting for unitCode: sort by number first, then by prefix
        allUnits.sort((a, b) => {
          // Extract numeric part from unit code (e.g., "401" from "PMVV401")
          const extractNumber = (code: string): number => {
            const match = code.match(/(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
          };

          // Extract prefix (e.g., "PMVV" from "PMVV401")
          const extractPrefix = (code: string): string => {
            const match = code.match(/^([A-Z_]+)/);
            return match ? match[1] : code;
          };

          const numA = extractNumber(a.unitCode);
          const numB = extractNumber(b.unitCode);
          const prefixA = extractPrefix(a.unitCode);
          const prefixB = extractPrefix(b.unitCode);

          // First sort by number
          if (numA !== numB) {
            return order === "asc" ? numA - numB : numB - numA;
          }

          // If numbers are equal, sort by prefix
          if (prefixA !== prefixB) {
            return order === "asc"
              ? prefixA.localeCompare(prefixB)
              : prefixB.localeCompare(prefixA);
          }

          // If both are equal, sort by full code
          return order === "asc"
            ? a.unitCode.localeCompare(b.unitCode)
            : b.unitCode.localeCompare(a.unitCode);
        });

        // Apply pagination after sorting
        units = allUnits.slice(skip, skip + limitNumber);
      } else {
        // Use normal Prisma sorting for other fields
        units = await this.prisma.unit.findMany({
          where,
          skip,
          take: limitNumber,
          orderBy: {
            [sortField]: order,
          },
        });
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPrevPage = pageNumber > 1;

      res.status(200).json({
        success: true,
        message: "Units retrieved successfully",
        data: units,
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
      console.error("Get all units error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const unitId = Array.isArray(id) ? id[0] : id;

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

      res.status(200).json({
        success: true,
        message: "Unit retrieved successfully",
        data: unit,
      });
    } catch (error) {
      console.error("Get unit by id error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
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
      const unitId = Array.isArray(id) ? id[0] : id;
      const {
        unitType,
        unitBrand,
        unitCode,
        unitDescription,
        unitImage,
        unitStatus,
      } = req.body;

      // Check if unit exists
      const existingUnit = await this.prisma.unit.findUnique({
        where: { id: unitId },
      });

      if (!existingUnit) {
        res.status(404).json({
          success: false,
          message: "Unit not found",
        });
        return;
      }

      // Validate unitType if provided
      if (unitType) {
        const validUnitTypes = Object.values(UnitType);
        if (!validUnitTypes.includes(unitType as UnitType)) {
          res.status(400).json({
            success: false,
            message: `Invalid unitType. Valid types are: ${validUnitTypes.join(
              ", ",
            )}`,
          });
          return;
        }
      }

      // Validate unitBrand if provided
      if (unitBrand) {
        const validUnitBrands = Object.values(UnitBrand);
        if (!validUnitBrands.includes(unitBrand as UnitBrand)) {
          res.status(400).json({
            success: false,
            message: `Invalid unitBrand. Valid brands are: ${validUnitBrands.join(
              ", ",
            )}`,
          });
          return;
        }
      }

      // Validate unitStatus if provided
      if (unitStatus) {
        const validStatuses = Object.values(UnitStatus);
        if (!validStatuses.includes(unitStatus as UnitStatus)) {
          res.status(400).json({
            success: false,
            message: `Invalid unitStatus. Valid statuses are: ${validStatuses.join(
              ", ",
            )}`,
          });
          return;
        }
      }

      // Check if unitCode already exists (if being updated)
      if (unitCode && unitCode !== existingUnit.unitCode) {
        const codeExists = await this.prisma.unit.findUnique({
          where: { unitCode },
        });

        if (codeExists) {
          res.status(409).json({
            success: false,
            message: "Unit with this code already exists",
          });
          return;
        }
      }

      // Build update data object
      const updateData: any = {};
      if (unitType !== undefined) updateData.unitType = unitType as UnitType;
      if (unitBrand !== undefined)
        updateData.unitBrand = unitBrand as UnitBrand;
      if (unitCode !== undefined) updateData.unitCode = unitCode;
      if (unitDescription !== undefined)
        updateData.unitDescription = unitDescription;
      if (unitImage !== undefined) updateData.unitImage = unitImage;
      if (unitStatus !== undefined)
        updateData.unitStatus = unitStatus as UnitStatus;
      updateData.updatedBy = userId;

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          message: "No fields to update",
        });
        return;
      }

      // Update unit
      const updatedUnit = await this.prisma.unit.update({
        where: { id: unitId },
        data: updateData,
      });

      res.status(200).json({
        success: true,
        message: "Unit updated successfully",
        data: updatedUnit,
      });
    } catch (error) {
      console.error("Update unit error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const unitId = Array.isArray(id) ? id[0] : id;

      // Check if unit exists
      const existingUnit = await this.prisma.unit.findUnique({
        where: { id: unitId },
      });

      if (!existingUnit) {
        res.status(404).json({
          success: false,
          message: "Unit not found",
        });
        return;
      }

      // Delete unit
      await this.prisma.unit.delete({
        where: { id: unitId },
      });

      res.status(200).json({
        success: true,
        message: "Unit deleted successfully",
      });
    } catch (error) {
      console.error("Delete unit error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }

  async bulkCreate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const unitsData: any[] = req.body;

      if (!Array.isArray(unitsData) || unitsData.length === 0) {
        res.status(400).json({
          success: false,
          message: "Request body must be an array of unit data",
        });
        return;
      }

      if (unitsData.length > 100) {
        res.status(400).json({
          success: false,
          message: "Maximum 100 units can be created in a single bulk request",
        });
        return;
      }

      const results: {
        success: boolean;
        message: string;
        unitCode?: string;
      }[] = [];
      const unitsToCreate: any[] = [];
      const existingUnitCodes = new Set<string>();

      // Pre-validation and deduplication within the input array
      for (const unitData of unitsData) {
        let {
          unitType,
          unitBrand,
          unitCode,
          unitDescription,
          unitImage,
          unitStatus = UnitStatus.ACTIVE,
        } = unitData;

        // Basic validation
        if (!unitType || !unitBrand || !unitCode) {
          results.push({
            success: false,
            message: "Missing required fields: unitType, unitBrand, unitCode",
            unitCode: unitCode || "N/A",
          });
          continue;
        }

        // Validate unitType
        const validUnitTypes = Object.values(UnitType);
        if (!validUnitTypes.includes(unitType as UnitType)) {
          results.push({
            success: false,
            message: `Invalid unitType. Valid types are: ${validUnitTypes.join(", ")}`,
            unitCode,
          });
          continue;
        }

        // Validate unitBrand
        const validUnitBrands = Object.values(UnitBrand);
        if (!validUnitBrands.includes(unitBrand as UnitBrand)) {
          results.push({
            success: false,
            message: `Invalid unitBrand. Valid brands are: ${validUnitBrands.join(", ")}`,
            unitCode,
          });
          continue;
        }

        // Validate unitStatus if provided
        if (unitStatus) {
          const validStatuses = Object.values(UnitStatus);
          if (!validStatuses.includes(unitStatus as UnitStatus)) {
            results.push({
              success: false,
              message: `Invalid unitStatus. Valid statuses are: ${validStatuses.join(", ")}`,
              unitCode,
            });
            continue;
          }
        }

        // Check for duplicates within the current batch
        if (existingUnitCodes.has(unitCode)) {
          results.push({
            success: false,
            message: "Duplicate unitCode in batch",
            unitCode,
          });
          continue;
        }

        existingUnitCodes.add(unitCode);

        unitsToCreate.push({
          unitType: unitType as UnitType,
          unitBrand: unitBrand as UnitBrand,
          unitCode,
          unitDescription: unitDescription || undefined,
          unitImage: unitImage || undefined,
          unitStatus: unitStatus as UnitStatus,
        });
      }

      // Check for duplicates against the database
      const unitsInDb = await this.prisma.unit.findMany({
        where: { unitCode: { in: unitsToCreate.map((u) => u.unitCode) } },
        select: { unitCode: true },
      });

      const dbExistingCodes = new Set(unitsInDb.map((u) => u.unitCode));

      const finalUnitsToCreate: any[] = [];
      for (const unit of unitsToCreate) {
        if (dbExistingCodes.has(unit.unitCode)) {
          results.push({
            success: false,
            message: "Unit with this code already exists in database",
            unitCode: unit.unitCode,
          });
        } else {
          finalUnitsToCreate.push(unit);
        }
      }

      // Create units in a transaction with increased timeout
      // Use createMany for better performance, then fetch created units
      const createdUnits = await this.prisma.$transaction(
        async (tx) => {
          // Use createMany for better performance
          await tx.unit.createMany({
            data: finalUnitsToCreate.map((unit) => ({
              ...unit,
              createdBy: userId,
            })),
            skipDuplicates: false, // We already checked for duplicates
          });

          // Fetch the created units to return them
          return await tx.unit.findMany({
            where: {
              unitCode: { in: finalUnitsToCreate.map((u) => u.unitCode) },
            },
            orderBy: {
              createdAt: "desc",
            },
          });
        },
        {
          maxWait: 10000, // Maximum time to wait for a transaction slot
          timeout: 30000, // Maximum time the transaction can run (30 seconds)
        },
      );

      createdUnits.forEach((unit) => {
        results.push({
          success: true,
          message: "Unit created successfully",
          unitCode: unit.unitCode,
        });
      });

      const successfulCreations = results.filter((r) => r.success).length;
      const failedCreations = results.filter((r) => !r.success).length;

      res.status(200).json({
        success: true,
        message: `${successfulCreations} units created, ${failedCreations} failed.`,
        data: results,
      });
    } catch (error) {
      console.error("Bulk create units error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    }
  }
}
