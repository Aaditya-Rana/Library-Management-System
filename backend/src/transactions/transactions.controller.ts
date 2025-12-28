import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { IssueBookDto } from './dto/issue-book.dto';
import { ReturnBookDto } from './dto/return-book.dto';
import { RenewTransactionDto } from './dto/renew-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { PayFineDto } from './dto/pay-fine.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Post('issue')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.CREATED)
    async issueBook(
        @Body() issueBookDto: IssueBookDto,
        @GetUser('id') librarianId: string,
    ) {
        const transaction = await this.transactionsService.issueBook(
            issueBookDto,
            librarianId,
        );
        return {
            success: true,
            message: 'Book issued successfully',
            data: transaction,
        };
    }

    @Post(':id/return')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async returnBook(
        @Param('id') id: string,
        @Body() returnBookDto: ReturnBookDto,
    ) {
        const transaction = await this.transactionsService.returnBook(
            id,
            returnBookDto,
        );
        return {
            success: true,
            message: 'Book returned successfully',
            data: transaction,
        };
    }

    @Post(':id/renew')
    @HttpCode(HttpStatus.OK)
    async renewTransaction(
        @Param('id') id: string,
        @Body() renewDto: RenewTransactionDto,
        @GetUser('id') userId: string,
    ) {
        const transaction = await this.transactionsService.renewTransaction(
            id,
            renewDto,
            userId,
        );
        return {
            success: true,
            message: 'Transaction renewed successfully',
            data: transaction,
        };
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async findAll(@Query() queryDto: QueryTransactionsDto) {
        return this.transactionsService.findAll(queryDto);
    }

    @Get('overdue')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async getOverdue() {
        return this.transactionsService.getOverdueTransactions();
    }

    @Get('stats')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async getStats(@Query('userId') userId?: string) {
        return this.transactionsService.getTransactionStats(userId);
    }

    @Get('user/:userId')
    @HttpCode(HttpStatus.OK)
    async findByUser(
        @Param('userId') userId: string,
        @Query() queryDto: QueryTransactionsDto,
        @GetUser('id') currentUserId: string,
        @GetUser('role') role: UserRole,
    ) {
        // Users can only view their own transactions unless they're admin/librarian
        if (
            userId !== currentUserId &&
            role !== UserRole.ADMIN &&
            role !== UserRole.LIBRARIAN &&
            role !== UserRole.SUPER_ADMIN
        ) {
            throw new Error('Forbidden');
        }

        return this.transactionsService.findByUser(userId, queryDto);
    }

    @Get('book/:bookId')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async findByBook(
        @Param('bookId') bookId: string,
        @Query() queryDto: QueryTransactionsDto,
    ) {
        return this.transactionsService.findByBook(bookId, queryDto);
    }

    // ==================== BORROW REQUEST ENDPOINTS ====================
    // NOTE: These MUST come before generic :id routes to prevent route conflicts

    @Post('request')
    @HttpCode(HttpStatus.CREATED)
    async createBorrowRequest(
        @Body() dto: any,
        @GetUser('id') userId: string,
    ) {
        return this.transactionsService.createBorrowRequest(dto, userId);
    }

    @Get('requests')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async getBorrowRequests(@Query() queryDto: any) {
        return this.transactionsService.getBorrowRequests(queryDto);
    }

    @Get('requests/my')
    @HttpCode(HttpStatus.OK)
    async getMyBorrowRequests(
        @Query() queryDto: any,
        @GetUser('id') userId: string,
    ) {
        return this.transactionsService.getUserBorrowRequests(userId, queryDto);
    }

    @Get('requests/:id')
    @HttpCode(HttpStatus.OK)
    async getBorrowRequest(
        @Param('id') id: string,
        @GetUser('id') userId: string,
        @GetUser('role') role: UserRole,
    ) {
        return this.transactionsService.getBorrowRequests({ userId: role === UserRole.USER ? userId : undefined });
    }

    @Post('requests/:id/approve')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async approveBorrowRequest(
        @Param('id') id: string,
        @Body() dto: any,
        @GetUser('id') librarianId: string,
    ) {
        return this.transactionsService.approveBorrowRequest(id, dto, librarianId);
    }

    @Post('requests/:id/reject')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async rejectBorrowRequest(
        @Param('id') id: string,
        @Body() dto: any,
        @GetUser('id') librarianId: string,
    ) {
        return this.transactionsService.rejectBorrowRequest(id, dto, librarianId);
    }

    @Delete('requests/:id')
    @HttpCode(HttpStatus.OK)
    async cancelBorrowRequest(
        @Param('id') id: string,
        @GetUser('id') userId: string,
    ) {
        return this.transactionsService.cancelBorrowRequest(id, userId);
    }

    // ==================== GENERIC TRANSACTION ENDPOINTS ====================
    // NOTE: Generic :id routes come AFTER specific routes

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(
        @Param('id') id: string,
        @GetUser('id') userId: string,
        @GetUser('role') role: UserRole,
    ) {
        const transaction = await this.transactionsService.findOne(id);

        // Users can only view their own transactions unless they're admin/librarian
        if (
            transaction.userId !== userId &&
            role !== UserRole.ADMIN &&
            role !== UserRole.LIBRARIAN &&
            role !== UserRole.SUPER_ADMIN
        ) {
            throw new Error('Forbidden');
        }

        return {
            success: true,
            data: transaction,
        };
    }

    @Get(':id/calculate-fine')
    @HttpCode(HttpStatus.OK)
    async calculateFine(@Param('id') id: string) {
        return this.transactionsService.calculateFine(id);
    }

    @Post(':id/pay-fine')
    @HttpCode(HttpStatus.OK)
    async payFine(
        @Param('id') id: string,
        @Body() payFineDto: PayFineDto,
    ) {
        return this.transactionsService.payFine(id, payFineDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async cancelTransaction(@Param('id') id: string) {
        return this.transactionsService.cancelTransaction(id);
    }

}
