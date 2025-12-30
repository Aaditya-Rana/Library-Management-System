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
        // In production (Serverless), use strictly 1 connection per instance to avoid exhausting DB limits
        const isProduction = process.env.NODE_ENV === 'production';
        const pool = new Pool({
            connectionString,
            max: isProduction ? 1 : 5,
            min: 0, // Allow scaling down to 0
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
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
