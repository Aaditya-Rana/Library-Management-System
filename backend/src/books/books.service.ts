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
}
