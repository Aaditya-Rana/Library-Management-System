import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        const email = 'admin@library.com';
        const password = 'Admin@123';

        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email },
        });

        if (existingAdmin) {
            console.log('✅ Admin user already exists:', email);
            console.log('   Role:', existingAdmin.role);
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
                firstName: 'Admin',
                lastName: 'User',
                emailVerified: true,
            },
        });

        console.log('✅ Admin user created successfully!');
        console.log('   Email:', email);
        console.log('   Password:', password);
        console.log('   Role:', admin.role);
        console.log('\n📝 Use these credentials to login and test the Books API');
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser();
