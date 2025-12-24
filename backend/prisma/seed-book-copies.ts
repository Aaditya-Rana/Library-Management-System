import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBookCopies() {
    try {
        // Get all books
        const books = await prisma.book.findMany({
            select: {
                id: true,
                title: true,
                totalCopies: true,
            },
        });

        console.log(`📚 Found ${books.length} books`);

        for (const book of books) {
            // Check existing copies
            const existingCopies = await prisma.bookCopy.count({
                where: { bookId: book.id },
            });

            const copiesToCreate = book.totalCopies - existingCopies;

            if (copiesToCreate <= 0) {
                console.log(`✅ "${book.title}" already has all copies`);
                continue;
            }

            // Create missing copies
            for (let i = 0; i < copiesToCreate; i++) {
                const copyNumber = String(existingCopies + i + 1).padStart(3, '0');
                const barcode = `BC-${book.id.substring(0, 8)}-${copyNumber}`;

                await prisma.bookCopy.create({
                    data: {
                        bookId: book.id,
                        copyNumber,
                        barcode,
                        status: 'AVAILABLE',
                        condition: 'GOOD',
                    },
                });
            }

            console.log(`✅ Created ${copiesToCreate} copies for "${book.title}"`);
        }

        console.log('\n✨ Book copies seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding book copies:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedBookCopies();
