const { PrismaClient } = require('@prisma/client');

// Load environment variables early for Prisma
require('dotenv').config();

/**
 * Prisma client singleton.
 * Reuses the same instance in development to avoid exhausting
 * the PostgreSQL connection limit during hot reloads.
 */
const prisma = global.__prisma || new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

/**
 * Connect to the database.
 * Prisma lazy-connects on first query, but this helper
 * eagerly verifies the connection for health-checks.
 * @returns {Promise<void>}
 */
async function connect() {
  await prisma.$connect();
}

/**
 * Disconnect from the database.
 * Should be called on graceful shutdown.
 * @returns {Promise<void>}
 */
async function disconnect() {
  await prisma.$disconnect();
}

module.exports = {
  prisma,
  connect,
  disconnect,
};
