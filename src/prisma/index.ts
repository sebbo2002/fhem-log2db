import { PrismaClient } from '@prisma/client';
import config from '../lib/config.js';

let prisma = null as PrismaClient | null;

export function connect(): void {
    prisma = new PrismaClient({
        datasources: {
            db: {
                url: config.database + (!config.database.includes('?') ? '?' : '&') + 'pool_timeout=120'
            }
        }
    });
}

export async function validateDatabaseUri (database: string): Promise<void> {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: database
            }
        }
    });

    await prisma.$connect();
    await prisma.$disconnect();
}

export function getClient () {
    return prisma;
}

export default prisma;
