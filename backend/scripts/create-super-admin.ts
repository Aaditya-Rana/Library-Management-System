import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

async function createSuperAdmin() {
    console.log('\n🔐 Super Admin Creation Script');
    console.log('================================\n');

    try {
        // Get super admin details
        const email = await question('Enter super admin email: ');
        if (!email || !email.includes('@')) {
            console.error('❌ Invalid email address');
            process.exit(1);
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.error(`❌ User with email ${email} already exists`);
            process.exit(1);
        }

        const password = await question('Enter super admin password (min 8 characters): ');
        if (!password || password.length < 8) {
            console.error('❌ Password must be at least 8 characters');
            process.exit(1);
        }

        const firstName = await question('Enter first name: ');
        if (!firstName) {
            console.error('❌ First name is required');
            process.exit(1);
        }

        const lastName = await question('Enter last name: ');
        if (!lastName) {
            console.error('❌ Last name is required');
            process.exit(1);
        }

        const phone = await question('Enter phone number (optional, press Enter to skip): ');

        console.log('\n📝 Creating super admin with the following details:');
        console.log(`   Email: ${email}`);
        console.log(`   Name: ${firstName} ${lastName}`);
        console.log(`   Phone: ${phone || 'Not provided'}`);
        console.log(`   Role: SUPER_ADMIN`);
        console.log(`   Status: ACTIVE\n`);

        const confirm = await question('Proceed with creation? (yes/no): ');
        if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
            console.log('❌ Super admin creation cancelled');
            process.exit(0);
        }

        // Hash password
        console.log('\n🔒 Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create super admin
        console.log('👤 Creating super admin user...');
        const superAdmin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone: phone || undefined,
                role: UserRole.SUPER_ADMIN,
                status: UserStatus.ACTIVE,
                emailVerified: true,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });

        console.log('\n✅ Super admin created successfully!');
        console.log('\n📋 Super Admin Details:');
        console.log(`   ID: ${superAdmin.id}`);
        console.log(`   Email: ${superAdmin.email}`);
        console.log(`   Name: ${superAdmin.firstName} ${superAdmin.lastName}`);
        console.log(`   Role: ${superAdmin.role}`);
        console.log(`   Status: ${superAdmin.status}`);
        console.log(`   Created: ${superAdmin.createdAt}`);
        console.log('\n🎉 You can now login with these credentials!\n');
    } catch (error) {
        console.error('\n❌ Error creating super admin:', error);
        process.exit(1);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

// Run the script
createSuperAdmin()
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
