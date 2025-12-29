import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private pool: Pool;

    constructor() {
        const connectionString = process.env.DATABASE_URL;

        // Create connection pool with limits
        const pool = new Pool({
            connectionString,
            max: 5, // Limit to 5 connections for Aiven free tier
            min: 1, // Keep at least 1 connection open
            idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
            connectionTimeoutMillis: 10000, // Timeout if connection takes > 10 seconds
        });

        const adapter = new PrismaPg(pool);

        super({
            adapter,
            log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        });

        this.pool = pool;
    }

    async onModuleInit() {
        await this.$connect();
        console.log('✅ Database connected with connection pool (max: 5 connections)');
    }

    async onModuleDestroy() {
        await this.$disconnect();
        await this.pool.end();
        console.log('✅ Database connections closed');
    }
}
