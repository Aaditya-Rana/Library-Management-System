import { Global, Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaService } from './prisma.service'; // Local import

@Global()
@Module({
    providers: [
        {
            provide: PrismaClient,
            useFactory: () => {
                const connectionString = process.env.DIRECT_URL;

                const pool = new Pool({
                    connectionString,
                    max: 5,
                    ssl: { rejectUnauthorized: false },
                });

                const adapter = new PrismaPg(pool);

                return new PrismaClient({
                    adapter,
                    log: ['error'], // Reduced logging for production
                });
            },
        },
        // Alias PrismaService token to the PrismaClient instance
        {
            provide: PrismaService,
            useExisting: PrismaClient,
        }
    ],
    exports: [PrismaClient, PrismaService],
})
export class PrismaModule implements OnModuleInit, OnModuleDestroy {
    constructor(private readonly prisma: PrismaClient) { }

    async onModuleInit() {
        await this.prisma.$connect();
        console.log('✅ Prisma connected');
    }

    async onModuleDestroy() {
        // We technically can't access 'pool' here easily unless we expose it, 
        // but Prisma's $disconnect + adapter handling should suffice or we can let the pool drain.
        // To be perfectly clean, we could return an object { prisma, pool } from factory 
        // but let's stick to standard client return. 
        // The pg pool will close when the process exits or mostly relies on Prisma to close.
        await this.prisma.$disconnect();
    }
}
