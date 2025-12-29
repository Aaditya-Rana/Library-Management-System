import { Global, Module, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create a single connection pool that will be reused
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString,
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection can't be established
});

const adapter = new PrismaPg(pool);

// Create a single PrismaClient instance
const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

@Global()
@Module({
    providers: [
        {
            provide: PrismaClient,
            useValue: prisma,
        },
    ],
    exports: [PrismaClient],
})
export class PrismaModule implements OnModuleInit {
    async onModuleInit() {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
    }

    async onModuleDestroy() {
        await prisma.$disconnect();
        await pool.end();
        console.log('✅ Database connections closed');
    }
}
