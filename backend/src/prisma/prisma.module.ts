import { Global, Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaService } from '../common/services/prisma.service'; // Import the token

const pool = new Pool({
    connectionString: process.env.DIRECT_URL, // 🔥 DIRECT DB ONLY
    max: 5, // Safe for Supabase
    ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
    log: ['error'],
});

@Global()
@Module({
    providers: [
        {
            provide: PrismaClient,
            useValue: prisma,
        },
        // PROVIDE PrismaService using the SAME singleton instance
        // This allows existing services (BooksService, etc) to work without changes
        {
            provide: PrismaService,
            useValue: prisma,
        }
    ],
    exports: [PrismaClient, PrismaService],
})
export class PrismaModule implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        await prisma.$connect();
        console.log('✅ Prisma connected');
    }

    async onModuleDestroy() {
        await prisma.$disconnect();
        await pool.end();
    }
}
