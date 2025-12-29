import { PrismaClient, SettingCategory, SettingDataType } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function seedSettings() {
    console.log('Seeding settings...');

    const settings = [
        // Library Settings
        {
            key: 'LIBRARY_NAME',
            value: 'Library Management System',
            category: SettingCategory.LIBRARY,
            dataType: SettingDataType.STRING,
            description: 'Name of the library',
            defaultValue: 'Library Management System',
            isEditable: true,
        },
        {
            key: 'MAX_BOOKS_PER_USER',
            value: '5',
            category: SettingCategory.LIBRARY,
            dataType: SettingDataType.NUMBER,
            description: 'Maximum number of books a user can borrow at once',
            defaultValue: '5',
            isEditable: true,
        },
        {
            key: 'LIBRARY_EMAIL',
            value: 'library@example.com',
            category: SettingCategory.LIBRARY,
            dataType: SettingDataType.STRING,
            description: 'Contact email for the library',
            defaultValue: 'library@example.com',
            isEditable: true,
        },
        {
            key: 'LIBRARY_PHONE',
            value: '+1234567890',
            category: SettingCategory.LIBRARY,
            dataType: SettingDataType.STRING,
            description: 'Contact phone number for the library',
            defaultValue: '+1234567890',
            isEditable: true,
        },
        // Fine Settings
        {
            key: 'FINE_PER_DAY',
            value: '10',
            category: SettingCategory.FINES,
            dataType: SettingDataType.NUMBER,
            description: 'Fine amount per day for overdue books (in currency units)',
            defaultValue: '10',
            isEditable: true,
        },
        {
            key: 'MAX_FINE_AMOUNT',
            value: '500',
            category: SettingCategory.FINES,
            dataType: SettingDataType.NUMBER,
            description: 'Maximum fine amount for a single book',
            defaultValue: '500',
            isEditable: true,
        },
        {
            key: 'GRACE_PERIOD_DAYS',
            value: '1',
            category: SettingCategory.FINES,
            dataType: SettingDataType.NUMBER,
            description: 'Grace period in days before fines start accumulating',
            defaultValue: '1',
            isEditable: true,
        },
        // Membership Settings
        {
            key: 'FREE_MEMBERSHIP_DURATION',
            value: '365',
            category: SettingCategory.MEMBERSHIP,
            dataType: SettingDataType.NUMBER,
            description: 'Duration of free membership in days',
            defaultValue: '365',
            isEditable: true,
        },
        {
            key: 'PREMIUM_MEMBERSHIP_PRICE',
            value: '999',
            category: SettingCategory.MEMBERSHIP,
            dataType: SettingDataType.NUMBER,
            description: 'Price for premium membership',
            defaultValue: '999',
            isEditable: true,
        },
        // Loan Settings
        {
            key: 'DEFAULT_LOAN_PERIOD',
            value: '14',
            category: SettingCategory.LOANS,
            dataType: SettingDataType.NUMBER,
            description: 'Default loan period in days',
            defaultValue: '14',
            isEditable: true,
        },
        {
            key: 'MAX_RENEWAL_COUNT',
            value: '2',
            category: SettingCategory.LOANS,
            dataType: SettingDataType.NUMBER,
            description: 'Maximum number of times a book can be renewed',
            defaultValue: '2',
            isEditable: true,
        },
        {
            key: 'RENEWAL_PERIOD_DAYS',
            value: '7',
            category: SettingCategory.LOANS,
            dataType: SettingDataType.NUMBER,
            description: 'Additional days added on renewal',
            defaultValue: '7',
            isEditable: true,
        },
        // System Settings
        {
            key: 'ENABLE_NOTIFICATIONS',
            value: 'true',
            category: SettingCategory.SYSTEM,
            dataType: SettingDataType.BOOLEAN,
            description: 'Enable email notifications',
            defaultValue: 'true',
            isEditable: true,
        },
        {
            key: 'MAINTENANCE_MODE',
            value: 'false',
            category: SettingCategory.SYSTEM,
            dataType: SettingDataType.BOOLEAN,
            description: 'Enable maintenance mode',
            defaultValue: 'false',
            isEditable: true,
        },
    ];

    for (const setting of settings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: {}, // Don't update existing settings
            create: setting,
        });
    }

    console.log(`✅ Created ${settings.length} settings`);
}

seedSettings()
    .catch((e) => {
        console.error('Error seeding settings:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
