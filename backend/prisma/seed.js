const { PrismaClient, SettingCategory, SettingDataType, UserRole, UserStatus } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting seed process...');


    // 1. Seed Settings
    try {
        console.log('Seeding settings...');
        const settings = [
            // Library Settings
            { key: 'LIBRARY_NAME', value: 'Library Management System', category: 'LIBRARY', dataType: 'STRING', description: 'Name of the library', defaultValue: 'Library Management System', isEditable: true },
            { key: 'MAX_BOOKS_PER_USER', value: '5', category: 'LIBRARY', dataType: 'NUMBER', description: 'Maximum number of books a user can borrow at once', defaultValue: '5', isEditable: true },
            { key: 'LIBRARY_EMAIL', value: 'library@example.com', category: 'LIBRARY', dataType: 'STRING', description: 'Contact email for the library', defaultValue: 'library@example.com', isEditable: true },
            { key: 'LIBRARY_PHONE', value: '+1234567890', category: 'LIBRARY', dataType: 'STRING', description: 'Contact phone number for the library', defaultValue: '+1234567890', isEditable: true },

            // Fine Settings
            { key: 'FINE_PER_DAY', value: '10', category: 'FINES', dataType: 'NUMBER', description: 'Fine amount per day for overdue books (in currency units)', defaultValue: '10', isEditable: true },
            { key: 'MAX_FINE_AMOUNT', value: '500', category: 'FINES', dataType: 'NUMBER', description: 'Maximum fine amount for a single book', defaultValue: '500', isEditable: true },
            { key: 'GRACE_PERIOD_DAYS', value: '1', category: 'FINES', dataType: 'NUMBER', description: 'Grace period in days before fines start accumulating', defaultValue: '1', isEditable: true },

            // Membership Settings
            { key: 'FREE_MEMBERSHIP_DURATION', value: '365', category: 'MEMBERSHIP', dataType: 'NUMBER', description: 'Duration of free membership in days', defaultValue: '365', isEditable: true },
            { key: 'PREMIUM_MEMBERSHIP_PRICE', value: '999', category: 'MEMBERSHIP', dataType: 'NUMBER', description: 'Price for premium membership', defaultValue: '999', isEditable: true },

            // Loan Settings
            { key: 'DEFAULT_LOAN_PERIOD', value: '14', category: 'LOANS', dataType: 'NUMBER', description: 'Default loan period in days', defaultValue: '14', isEditable: true },
            { key: 'MAX_RENEWAL_COUNT', value: '2', category: 'LOANS', dataType: 'NUMBER', description: 'Maximum number of times a book can be renewed', defaultValue: '2', isEditable: true },
            { key: 'RENEWAL_PERIOD_DAYS', value: '7', category: 'LOANS', dataType: 'NUMBER', description: 'Additional days added on renewal', defaultValue: '7', isEditable: true },

            // System Settings
            { key: 'ENABLE_NOTIFICATIONS', value: 'true', category: 'SYSTEM', dataType: 'BOOLEAN', description: 'Enable email notifications', defaultValue: 'true', isEditable: true },
            { key: 'MAINTENANCE_MODE', value: 'false', category: 'SYSTEM', dataType: 'BOOLEAN', description: 'Enable maintenance mode', defaultValue: 'false', isEditable: true },
        ];

        for (const setting of settings) {
            await prisma.setting.upsert({
                where: { key: setting.key },
                update: {},
                create: setting,
            });
        }
        console.log('✅ Settings seeded.');
    } catch (e) {
        console.error('Error seeding settings:', e);
    }

    // 2. Seed Admin
    try {
        console.log('Seeding admin...');
        const email = 'admin@library.com';
        const password = await bcrypt.hash('Admin@123', 10);

        await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                password,
                role: 'ADMIN',
                status: 'ACTIVE',
                firstName: 'Admin',
                lastName: 'User',
                emailVerified: true
            }
        });
        console.log('✅ Admin seeded.');
    } catch (e) {
        console.error('Error seeding admin:', e);
    }

    // 3. Seed Users
    try {
        console.log('Seeding users...');
        const password = await bcrypt.hash('User@123', 10);
        const users = [
            { email: 'john.doe@example.com', firstName: 'John', lastName: 'Doe', role: 'USER' },
            { email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith', role: 'USER' },
            { email: 'active.user@example.com', firstName: 'Active', lastName: 'User', role: 'USER' }
        ];

        for (const user of users) {
            await prisma.user.upsert({
                where: { email: user.email },
                update: {},
                create: {
                    ...user,
                    password,
                    status: 'ACTIVE',
                    emailVerified: true
                }
            });
        }
        console.log('✅ Users seeded.');
    } catch (e) {
        console.error('Error seeding users:', e);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
