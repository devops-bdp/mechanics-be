"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
// Initialize connection pool
// Try DATABASE_URL first, fallback to DIRECT_URL if connection fails
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL must be set in environment variables");
}
const pool = new pg_1.Pool({
    connectionString,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
});
// Handle pool errors
pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
});
// Initialize Prisma Client with adapter
const adapter = new adapter_pg_1.PrismaPg(pool);
exports.prisma = new client_1.PrismaClient({ adapter });
// Test connection on startup
exports.prisma
    .$connect()
    .then(() => {
    console.log("✅ Database connected successfully");
})
    .catch((error) => {
    console.error("❌ Failed to connect to database:", error);
    console.error("Connection string:", connectionString?.replace(/:[^:@]+@/, ":****@"));
});
// Graceful shutdown
process.on("SIGINT", async () => {
    await exports.prisma.$disconnect();
    await pool.end();
});
process.on("SIGTERM", async () => {
    await exports.prisma.$disconnect();
    await pool.end();
});
