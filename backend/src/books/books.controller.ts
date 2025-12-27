import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { QueryBooksDto } from './dto/query-books.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AddBookCopiesDto } from './dto/add-book-copies.dto';
import { UpdateBookCopyDto } from './dto/update-book-copy.dto';
import { UpdateCopyStatusDto } from './dto/update-copy-status.dto';
import { BulkImportBooksDto } from './dto/bulk-import-books.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('books')
export class BooksController {
    constructor(private readonly booksService: BooksService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @UseInterceptors(FileInterceptor('coverImage'))
    async create(
        @Body() createBookDto: CreateBookDto,
        @UploadedFile() coverImage?: Express.Multer.File,
    ) {
        const book = await this.booksService.create(createBookDto, coverImage);
        return {
            success: true,
            message: 'Book created successfully',
            data: book,
        };
    }

    @Post('bulk-import')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    async bulkImport(@Body() bulkImportDto: BulkImportBooksDto) {
        return this.booksService.bulkImport(bulkImportDto.books);
    }

    /**
     * Get paginated list of books (PUBLIC - no auth required)
     */
    @Get()
    async findAll(@Query() queryDto: QueryBooksDto) {
        return this.booksService.findAll(queryDto);
    }

    /**
     * Get book by ISBN (PUBLIC - no auth required)
     */
    @Get('isbn/:isbn')
    async findByISBN(@Param('isbn') isbn: string) {
        const book = await this.booksService.findByISBN(isbn);
        return {
            success: true,
            data: book,
        };
    }

    /**
     * Get single book by ID (PUBLIC - no auth required)  
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const book = await this.booksService.findOne(id);
        return {
            success: true,
            data: book,
        };
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @UseInterceptors(FileInterceptor('coverImage'))
    async update(
        @Param('id') id: string,
        @Body() updateBookDto: UpdateBookDto,
        @UploadedFile() coverImage?: Express.Multer.File,
    ) {
        const book = await this.booksService.update(id, updateBookDto, coverImage);
        return {
            success: true,
            message: 'Book updated successfully',
            data: book,
        };
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string) {
        return this.booksService.remove(id);
    }

    @Post(':id/cover')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @UseInterceptors(FileInterceptor('coverImage'))
    async uploadCover(
        @Param('id') id: string,
        @UploadedFile() coverImage: Express.Multer.File,
    ) {
        if (!coverImage) {
            return {
                success: false,
                message: 'No file uploaded',
            };
        }

        const uploadResult = await this.booksService.uploadCoverImage(coverImage);

        // Update book with new cover URL
        await this.booksService.update(id, { coverImageUrl: uploadResult.secure_url });

        return {
            success: true,
            message: 'Cover image uploaded successfully',
            data: {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
            },
        };
    }

    @Patch(':id/inventory')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    async updateInventory(
        @Param('id') id: string,
        @Body() updateInventoryDto: UpdateInventoryDto,
    ) {
        const book = await this.booksService.updateInventory(
            id,
            updateInventoryDto.quantity,
        );
        return {
            success: true,
            message: 'Inventory updated successfully',
            data: book,
        };
    }

    @Get(':id/stats')
    async getStats(@Param('id') id: string) {
        const stats = await this.booksService.getBookStats(id);
        return {
            success: true,
            data: stats,
        };
    }

    @Get(':id/availability')
    async checkAvailability(@Param('id') id: string) {
        const isAvailable = await this.booksService.checkAvailability(id);
        return {
            success: true,
            data: {
                bookId: id,
                isAvailable,
            },
        };
    }

    @Post(':id/copies')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    async addCopies(
        @Param('id') id: string,
        @Body() dto: AddBookCopiesDto,
    ) {
        return this.booksService.addBookCopies(id, dto);
    }

    @Get(':id/copies')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    async getBookCopies(@Param('id') id: string) {
        return this.booksService.getBookCopies(id);
    }

    @Get(':bookId/copies/:copyId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    async getBookCopyById(
        @Param('bookId') bookId: string,
        @Param('copyId') copyId: string,
    ) {
        return this.booksService.getBookCopyById(bookId, copyId);
    }

    @Patch(':bookId/copies/:copyId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    async updateBookCopy(
        @Param('bookId') bookId: string,
        @Param('copyId') copyId: string,
        @Body() dto: UpdateBookCopyDto,
    ) {
        return this.booksService.updateBookCopy(bookId, copyId, dto);
    }

    @Patch(':bookId/copies/:copyId/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    async updateCopyStatus(
        @Param('bookId') bookId: string,
        @Param('copyId') copyId: string,
        @Body() dto: UpdateCopyStatusDto,
    ) {
        return this.booksService.updateCopyStatus(bookId, copyId, dto);
    }

    @Delete(':bookId/copies/:copyId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async deleteBookCopy(
        @Param('bookId') bookId: string,
        @Param('copyId') copyId: string,
    ) {
        return this.booksService.deleteBookCopy(bookId, copyId);
    }
}
