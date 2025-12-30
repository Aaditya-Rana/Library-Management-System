import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedUsers() {
    console.log('Seeding dummy users...');
    const password = await bcrypt.hash('User@123', 10);

    const users = [
        {
            email: 'john.doe@example.com',
            password,
            firstName: 'John',
            lastName: 'Doe',
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
            emailVerified: true,
        },
        {
            email: 'jane.smith@example.com',
            password,
            firstName: 'Jane',
            lastName: 'Smith',
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
            emailVerified: true,
        },
        {
            email: 'robert.brown@example.com',
            password,
            firstName: 'Robert',
            lastName: 'Brown',
            role: UserRole.USER,
            status: UserStatus.SUSPENDED, // One suspended user
            emailVerified: true,
        },
        {
            email: 'alice.librarian@library.com',
            password,
            firstName: 'Alice',
            lastName: 'Librarian',
            role: UserRole.LIBRARIAN,
            status: UserStatus.ACTIVE,
            emailVerified: true,
        },
    ];

    for (const user of users) {
        const existing = await prisma.user.findUnique({ where: { email: user.email } });
        if (!existing) {
            await prisma.user.create({ data: user });
            console.log(`Created user: ${user.email}`);
        } else {
            console.log(`User already exists: ${user.email}`);
        }
    }
}

seedUsers()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
