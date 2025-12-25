import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { QueryReportsDto } from './dto/query-reports.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('dashboard')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async getDashboard() {
        return this.reportsService.getDashboardStats();
    }

    @Get('users/active')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async getActiveUsers(@Query() queryDto: QueryReportsDto) {
        return this.reportsService.getActiveUsers(queryDto);
    }

    @Get('users/overdue')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async getOverdueUsers() {
        return this.reportsService.getOverdueUsers();
    }

    @Get('books/popular')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async getPopularBooks(@Query() queryDto: QueryReportsDto) {
        return this.reportsService.getPopularBooks(queryDto);
    }

    @Get('books/low-circulation')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async getLowCirculationBooks(@Query('limit') limit?: number) {
        return this.reportsService.getLowCirculationBooks(limit);
    }

    @Get('books/categories')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async getCategoryDistribution() {
        return this.reportsService.getCategoryDistribution();
    }

    @Get('circulation')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async getCirculationStats(@Query() queryDto: QueryReportsDto) {
        return this.reportsService.getCirculationStats(queryDto);
    }

    @Get('financial/summary')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async getFinancialSummary(@Query() queryDto: QueryReportsDto) {
        return this.reportsService.getFinancialSummary(queryDto);
    }
}
