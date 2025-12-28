import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('record')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.CREATED)
    async recordPayment(
        @Body() recordPaymentDto: RecordPaymentDto,
        @GetUser('id') librarianId: string,
    ) {
        return this.paymentsService.recordPayment(recordPaymentDto, librarianId);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(
        @Param('id') id: string,
        @GetUser('id') userId: string,
        @GetUser('role') role: UserRole,
    ) {
        return this.paymentsService.findOne(id, userId, role);
    }

    @Get('user/:userId')
    @HttpCode(HttpStatus.OK)
    async findByUser(
        @Param('userId') userId: string,
        @Query() queryDto: QueryPaymentsDto,
        @GetUser('id') requestingUserId: string,
        @GetUser('role') role: UserRole,
    ) {
        return this.paymentsService.findByUser(
            userId,
            queryDto,
            requestingUserId,
            role,
        );
    }

    @Get('transaction/:transactionId')
    @HttpCode(HttpStatus.OK)
    async findByTransaction(
        @Param('transactionId') transactionId: string,
        @GetUser('id') userId: string,
        @GetUser('role') role: UserRole,
    ) {
        return this.paymentsService.findByTransaction(
            transactionId,
            userId,
            role,
        );
    }

    @Post(':id/refund')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async processRefund(
        @Param('id') id: string,
        @Body() refundPaymentDto: RefundPaymentDto,
    ) {
        return this.paymentsService.processRefund(id, refundPaymentDto);
    }

    @Get('transaction/:transactionId/breakdown')
    @HttpCode(HttpStatus.OK)
    async calculateBreakdown(
        @Param('transactionId') transactionId: string,
    ) {
        return this.paymentsService.calculatePaymentBreakdown(transactionId);
    }
}
