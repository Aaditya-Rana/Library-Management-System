import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { QueryBooksDto } from './dto/query-books.dto';
import { AddBookCopiesDto } from './dto/add-book-copies.dto';
import { UpdateBookCopyDto } from './dto/update-book-copy.dto';
import { UpdateCopyStatusDto } from './dto/update-copy-status.dto';

@Injectable()
export class BooksService {
    constructor(
        private prisma: PrismaService,
        private cloudinary: CloudinaryService,
    ) { }

    async findAll(queryDto: QueryBooksDto) {
        const {
            page = 1,
            limit = 10,
            category,
            genre,
            language,
            status,
            availability,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = queryDto;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: {
            category?: string;
            genre?: string;
            language?: string;
            isActive?: boolean;
            availableCopies?: { gt: number } | number;
            OR?: Array<{
                title?: { contains: string; mode: 'insensitive' };
                author?: { contains: string; mode: 'insensitive' };
                isbn?: { contains: string };
            }>;
        } = {};

        if (category) where.category = category;
        if (genre) where.genre = genre;
        if (language) where.language = language;
        if (status) {
            where.isActive = status === 'ACTIVE';
        }

        // Availability filter
        if (availability === 'available') {
            where.availableCopies = { gt: 0 };
        } else if (availability === 'unavailable') {
            where.availableCopies = 0;
        }

        // Search in title, author, or ISBN
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } },
                { isbn: { contains: search } },
            ];
        }



        // Execute query
        const [books, total] = await Promise.all([
            this.prisma.book.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.book.count({ where }),
        ]);

        return {
            data: books,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const book = await this.prisma.book.findUnique({
            where: { id },
        });

        if (!book) {
            throw new NotFoundException(`Book with ID ${id} not found`);
        }

        return book;
    }

    async findByISBN(isbn: string) {
        const book = await this.prisma.book.findUnique({
            where: { isbn },
        });

        if (!book) {
            throw new NotFoundException(`Book with ISBN ${isbn} not found`);
        }

        return book;
    }

    async create(createBookDto: CreateBookDto, coverImage?: Express.Multer.File) {
        // Check if ISBN already exists
        const existingBook = await this.prisma.book.findUnique({
            where: { isbn: createBookDto.isbn },
        });

        if (existingBook) {
            throw new ConflictException(`Book with ISBN ${createBookDto.isbn} already exists`);
        }

        // Upload cover image if provided
        let coverImageUrl = createBookDto.coverImageUrl;
        if (coverImage) {
            const uploadResult = await this.uploadCoverImage(coverImage);
            coverImageUrl = uploadResult.secure_url;
        }

        // Set defaults
        const totalCopies = createBookDto.totalCopies || 1;
        const availableCopies = createBookDto.availableCopies !== undefined
            ? createBookDto.availableCopies
            : totalCopies;

        // Validate available copies
        if (availableCopies > totalCopies) {
            throw new BadRequestException('Available copies cannot exceed total copies');
        }

        const book = await this.prisma.book.create({
            data: {
                ...createBookDto,
                totalCopies,
                availableCopies,
                coverImageUrl,
                language: createBookDto.language || 'English',
                isActive: true,
            },
        });

        return book;
    }

    async update(id: string, updateBookDto: UpdateBookDto, coverImage?: Express.Multer.File) {
        // Check if book exists
        const existingBook = await this.findOne(id);

        // If ISBN is being updated, check for conflicts
        if (updateBookDto.isbn && updateBookDto.isbn !== existingBook.isbn) {
            const duplicateBook = await this.prisma.book.findUnique({
                where: { isbn: updateBookDto.isbn },
            });

            if (duplicateBook) {
                throw new ConflictException(`Book with ISBN ${updateBookDto.isbn} already exists`);
            }
        }

        // Upload new cover image if provided
        let coverImageUrl = updateBookDto.coverImageUrl;
        if (coverImage) {
            const uploadResult = await this.uploadCoverImage(coverImage);
            coverImageUrl = uploadResult.secure_url;
        }

        // Validate available copies if being updated
        const totalCopies = updateBookDto.totalCopies || existingBook.totalCopies;
        const availableCopies = updateBookDto.availableCopies !== undefined
            ? updateBookDto.availableCopies
            : existingBook.availableCopies;

        if (availableCopies > totalCopies) {
            throw new BadRequestException('Available copies cannot exceed total copies');
        }

        const book = await this.prisma.book.update({
            where: { id },
            data: {
                ...updateBookDto,
                ...(coverImageUrl && { coverImageUrl }),
            },
        });

        return book;
    }

    async remove(id: string) {
        // Check if book exists
        await this.findOne(id);

        // Soft delete by setting isActive to false
        const book = await this.prisma.book.update({
            where: { id },
            data: { isActive: false },
        });

        return {
            success: true,
            message: 'Book deleted successfully',
            data: book,
        };
    }

    async uploadCoverImage(file: Express.Multer.File) {
        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Only image files (JPEG, PNG, WebP) are allowed');
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new BadRequestException('File size must not exceed 5MB');
        }

        return this.cloudinary.uploadImage(file, 'books');
    }

    async updateInventory(id: string, quantity: number) {
        // Check if book exists
        const book = await this.findOne(id);

        // Calculate new available copies
        const difference = quantity - book.totalCopies;
        const newAvailableCopies = book.availableCopies + difference;

        if (newAvailableCopies < 0) {
            throw new BadRequestException(
                'Cannot reduce inventory below currently borrowed copies',
            );
        }

        const updatedBook = await this.prisma.book.update({
            where: { id },
            data: {
                totalCopies: quantity,
                availableCopies: newAvailableCopies,
            },
        });

        return updatedBook;
    }

    async checkAvailability(id: string): Promise<boolean> {
        const book = await this.findOne(id);
        return book.availableCopies > 0 && book.isActive;
    }

    async getBookStats(id: string) {
        const book = await this.findOne(id);

        // Calculate borrowed copies
        const borrowedCopies = book.totalCopies - book.availableCopies;
        const availabilityPercentage = (book.availableCopies / book.totalCopies) * 100;

        return {
            bookId: book.id,
            title: book.title,
            totalCopies: book.totalCopies,
            availableCopies: book.availableCopies,
            borrowedCopies,
            availabilityPercentage: Math.round(availabilityPercentage),
            isAvailable: book.availableCopies > 0,
            isActive: book.isActive,
        };
    }

    async addBookCopies(bookId: string, dto: AddBookCopiesDto) {
        // Verify book exists
        const book = await this.prisma.book.findUnique({
            where: { id: bookId },
            include: {
                copies: {
                    orderBy: { copyNumber: 'desc' },
                    take: 1,
                },
            },
        });

        if (!book) {
            throw new NotFoundException(`Book with ID ${bookId} not found`);
        }

        // Get the last copy number
        const lastCopyNumber = book.copies[0]?.copyNumber || '000';
        const startNumber = dto.startingCopyNumber
            ? parseInt(dto.startingCopyNumber, 10)
            : parseInt(lastCopyNumber, 10) + 1;

        // Generate copies data
        const copiesToCreate: Array<{
            bookId: string;
            copyNumber: string;
            barcode: string;
            status: 'AVAILABLE';
            condition: 'GOOD';
            shelfLocation?: string;
            section?: string;
        }> = [];
        for (let i = 0; i < dto.numberOfCopies; i++) {
            const copyNumber = String(startNumber + i).padStart(3, '0');
            const barcode = `BC-${bookId.substring(0, 8)}-${copyNumber}`;

            copiesToCreate.push({
                bookId,
                copyNumber,
                barcode,
                status: 'AVAILABLE' as const,
                condition: 'GOOD' as const,
                shelfLocation: dto.shelfLocation,
                section: dto.section,
            });
        }

        // Create copies and update book counters in a transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Create all copies
            const createdCopies = await Promise.all(
                copiesToCreate.map((copyData) =>
                    tx.bookCopy.create({
                        data: copyData,
                    }),
                ),
            );

            // Update book counters
            const updatedBook = await tx.book.update({
                where: { id: bookId },
                data: {
                    totalCopies: { increment: dto.numberOfCopies },
                    availableCopies: { increment: dto.numberOfCopies },
                },
            });

            return { createdCopies, updatedBook };
        });

        return {
            success: true,
            message: `${dto.numberOfCopies} ${dto.numberOfCopies === 1 ? 'copy' : 'copies'} added successfully`,
            data: {
                bookId: book.id,
                bookTitle: book.title,
                copiesAdded: dto.numberOfCopies,
                totalCopies: result.updatedBook.totalCopies,
                availableCopies: result.updatedBook.availableCopies,
                copies: result.createdCopies.map((copy) => ({
                    id: copy.id,
                    copyNumber: copy.copyNumber,
                    barcode: copy.barcode,
                    status: copy.status,
                    shelfLocation: copy.shelfLocation,
                    section: copy.section,
                })),
            },
        };
    }

    async getBookCopies(bookId: string) {
        // Verify book exists
        const book = await this.prisma.book.findUnique({
            where: { id: bookId },
        });

        if (!book) {
            throw new NotFoundException(`Book with ID ${bookId} not found`);
        }

        const copies = await this.prisma.bookCopy.findMany({
            where: { bookId },
            orderBy: { copyNumber: 'asc' },
            include: {
                transactions: {
                    where: {
                        status: { in: ['ISSUED', 'RENEWED'] },
                    },
                    select: {
                        id: true,
                        dueDate: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        return {
            success: true,
            data: {
                bookId: book.id,
                bookTitle: book.title,
                totalCopies: copies.length,
                copies: copies.map((copy) => ({
                    id: copy.id,
                    copyNumber: copy.copyNumber,
                    barcode: copy.barcode,
                    status: copy.status,
                    condition: copy.condition,
                    shelfLocation: copy.shelfLocation,
                    section: copy.section,
                    acquiredDate: copy.acquiredDate,
                    lastIssuedDate: copy.lastIssuedDate,
                    conditionNotes: copy.conditionNotes,
                    currentTransaction: copy.transactions[0] || null,
                })),
            },
        };
    }

    async getBookCopyById(bookId: string, copyId: string) {
        const copy = await this.prisma.bookCopy.findFirst({
            where: {
                id: copyId,
                bookId,
            },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        isbn: true,
                    },
                },
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        issueDate: true,
                        dueDate: true,
                        returnDate: true,
                        status: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!copy) {
            throw new NotFoundException(`Book copy with ID ${copyId} not found`);
        }

        return {
            success: true,
            data: {
                ...copy,
                transactionHistory: copy.transactions,
            },
        };
    }

    async updateBookCopy(bookId: string, copyId: string, dto: UpdateBookCopyDto) {
        // Verify copy exists and belongs to book
        const copy = await this.prisma.bookCopy.findFirst({
            where: {
                id: copyId,
                bookId,
            },
        });

        if (!copy) {
            throw new NotFoundException(`Book copy with ID ${copyId} not found`);
        }

        const updatedCopy = await this.prisma.bookCopy.update({
            where: { id: copyId },
            data: {
                shelfLocation: dto.shelfLocation,
                section: dto.section,
                condition: dto.condition,
                conditionNotes: dto.conditionNotes,
                conditionPhotos: dto.conditionPhotos ? JSON.parse(JSON.stringify(dto.conditionPhotos)) : undefined,
            },
        });

        return {
            success: true,
            message: 'Book copy updated successfully',
            data: updatedCopy,
        };
    }

    async updateCopyStatus(bookId: string, copyId: string, dto: UpdateCopyStatusDto) {
        // Verify copy exists and belongs to book
        const copy = await this.prisma.bookCopy.findFirst({
            where: {
                id: copyId,
                bookId,
            },
        });

        if (!copy) {
            throw new NotFoundException(`Book copy with ID ${copyId} not found`);
        }

        // Check if copy is currently issued
        if (dto.status !== 'AVAILABLE') {
            const activeTransaction = await this.prisma.transaction.findFirst({
                where: {
                    bookCopyId: copyId,
                    status: { in: ['ISSUED', 'RENEWED'] },
                },
            });

            if (activeTransaction) {
                throw new BadRequestException('Cannot change status of currently issued copy');
            }
        }

        // Determine if we need to update availableCopies counter
        const oldStatus = copy.status;
        const newStatus = dto.status;
        let availableCopiesChange = 0;

        // If changing from AVAILABLE to non-AVAILABLE, decrement
        if (oldStatus === 'AVAILABLE' && newStatus !== 'AVAILABLE') {
            availableCopiesChange = -1;
        }
        // If changing from non-AVAILABLE to AVAILABLE, increment
        else if (oldStatus !== 'AVAILABLE' && newStatus === 'AVAILABLE') {
            availableCopiesChange = 1;
        }

        // Update in transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Update copy status
            const updatedCopy = await tx.bookCopy.update({
                where: { id: copyId },
                data: {
                    status: dto.status,
                    conditionNotes: dto.notes
                        ? `${copy.conditionNotes || ''}\n[${new Date().toISOString()}] Status changed to ${dto.status}. Reason: ${dto.reason || 'N/A'}. Notes: ${dto.notes}`
                        : copy.conditionNotes,
                },
            });

            // Update book's availableCopies if needed
            if (availableCopiesChange !== 0) {
                await tx.book.update({
                    where: { id: bookId },
                    data: {
                        availableCopies: { increment: availableCopiesChange },
                    },
                });
            }

            return updatedCopy;
        });

        return {
            success: true,
            message: `Copy status updated to ${dto.status}`,
            data: result,
        };
    }

    async deleteBookCopy(bookId: string, copyId: string) {
        // Verify copy exists and belongs to book
        const copy = await this.prisma.bookCopy.findFirst({
            where: {
                id: copyId,
                bookId,
            },
        });

        if (!copy) {
            throw new NotFoundException(`Book copy with ID ${copyId} not found`);
        }

        // Check if copy is currently issued
        const activeTransaction = await this.prisma.transaction.findFirst({
            where: {
                bookCopyId: copyId,
                status: { in: ['ISSUED', 'RENEWED'] },
            },
        });

        if (activeTransaction) {
            throw new BadRequestException('Cannot delete a copy that is currently issued');
        }

        // Delete in transaction and update counters
        await this.prisma.$transaction(async (tx) => {
            // Delete the copy
            await tx.bookCopy.delete({
                where: { id: copyId },
            });

            // Update book counters
            const decrementAvailable = copy.status === 'AVAILABLE' ? 1 : 0;
            await tx.book.update({
                where: { id: bookId },
                data: {
                    totalCopies: { decrement: 1 },
                    availableCopies: { decrement: decrementAvailable },
                },
            });
        });

        return {
            success: true,
            message: 'Book copy deleted successfully',
        };
    }
}

