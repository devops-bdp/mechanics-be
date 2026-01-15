"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitController = void 0;
const client_1 = require("@prisma/client");
class UnitController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }
            const { unitType, unitBrand, unitCode, unitDescription, unitImage, unitStatus = client_1.UnitStatus.ACTIVE, } = req.body;
            // Validation
            if (!unitType || !unitBrand || !unitCode) {
                res.status(400).json({
                    success: false,
                    message: "Missing required fields: unitType, unitBrand, unitCode",
                });
                return;
            }
            // Validate unitType
            const validUnitTypes = Object.values(client_1.UnitType);
            if (!validUnitTypes.includes(unitType)) {
                res.status(400).json({
                    success: false,
                    message: `Invalid unitType. Valid types are: ${validUnitTypes.join(", ")}`,
                });
                return;
            }
            // Validate unitBrand
            const validUnitBrands = Object.values(client_1.UnitBrand);
            if (!validUnitBrands.includes(unitBrand)) {
                res.status(400).json({
                    success: false,
                    message: `Invalid unitBrand. Valid brands are: ${validUnitBrands.join(", ")}`,
                });
                return;
            }
            // Validate unitStatus if provided
            if (unitStatus) {
                const validStatuses = Object.values(client_1.UnitStatus);
                if (!validStatuses.includes(unitStatus)) {
                    res.status(400).json({
                        success: false,
                        message: `Invalid unitStatus. Valid statuses are: ${validStatuses.join(", ")}`,
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
                    unitType: unitType,
                    unitBrand: unitBrand,
                    unitCode,
                    unitDescription,
                    unitImage,
                    unitStatus: unitStatus,
                    createdBy: userId,
                },
            });
            res.status(201).json({
                success: true,
                message: "Unit created successfully",
                data: unit,
            });
        }
        catch (error) {
            console.error("Create unit error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async getAll(req, res) {
        try {
            const { status, type, brand, search, page = "1", limit = "10", sortBy = "createdAt", sortOrder = "desc", } = req.query;
            // Parse pagination parameters
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
                            contains: searchValue,
                            mode: "insensitive",
                        },
                    },
                    {
                        unitDescription: {
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
                "unitCode",
                "unitType",
                "unitBrand",
                "unitStatus",
            ];
            const sortField = validSortFields.includes(sortBy)
                ? sortBy
                : "createdAt";
            // Validate sortOrder
            const order = sortOrder === "asc" ? "asc" : "desc";
            // Get total count for pagination
            const totalCount = await this.prisma.unit.count({ where });
            // Get paginated units
            const units = await this.prisma.unit.findMany({
                where,
                skip,
                take: limitNumber,
                orderBy: {
                    [sortField]: order,
                },
            });
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
        }
        catch (error) {
            console.error("Get all units error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async getById(req, res) {
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
        }
        catch (error) {
            console.error("Get unit by id error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async update(req, res) {
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
            const { unitType, unitBrand, unitCode, unitDescription, unitImage, unitStatus, } = req.body;
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
                const validUnitTypes = Object.values(client_1.UnitType);
                if (!validUnitTypes.includes(unitType)) {
                    res.status(400).json({
                        success: false,
                        message: `Invalid unitType. Valid types are: ${validUnitTypes.join(", ")}`,
                    });
                    return;
                }
            }
            // Validate unitBrand if provided
            if (unitBrand) {
                const validUnitBrands = Object.values(client_1.UnitBrand);
                if (!validUnitBrands.includes(unitBrand)) {
                    res.status(400).json({
                        success: false,
                        message: `Invalid unitBrand. Valid brands are: ${validUnitBrands.join(", ")}`,
                    });
                    return;
                }
            }
            // Validate unitStatus if provided
            if (unitStatus) {
                const validStatuses = Object.values(client_1.UnitStatus);
                if (!validStatuses.includes(unitStatus)) {
                    res.status(400).json({
                        success: false,
                        message: `Invalid unitStatus. Valid statuses are: ${validStatuses.join(", ")}`,
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
            const updateData = {};
            if (unitType !== undefined)
                updateData.unitType = unitType;
            if (unitBrand !== undefined)
                updateData.unitBrand = unitBrand;
            if (unitCode !== undefined)
                updateData.unitCode = unitCode;
            if (unitDescription !== undefined)
                updateData.unitDescription = unitDescription;
            if (unitImage !== undefined)
                updateData.unitImage = unitImage;
            if (unitStatus !== undefined)
                updateData.unitStatus = unitStatus;
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
        }
        catch (error) {
            console.error("Update unit error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
    async delete(req, res) {
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
        }
        catch (error) {
            console.error("Delete unit error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? String(error) : undefined,
            });
        }
    }
}
exports.UnitController = UnitController;
