import {
    Controller,
    Get,
    Patch,
    Delete,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    async getUserNotifications(
        @Query() queryDto: QueryNotificationsDto,
        @GetUser('id') userId: string,
        @GetUser('role') role: UserRole,
    ) {
        return this.notificationsService.getUserNotifications(
            userId,
            queryDto,
            userId,
            role,
        );
    }

    @Get('unread-count')
    @HttpCode(HttpStatus.OK)
    async getUnreadCount(
        @GetUser('id') userId: string,
        @GetUser('role') role: UserRole,
    ) {
        return this.notificationsService.getUnreadCount(userId, userId, role);
    }

    @Patch(':id/read')
    @HttpCode(HttpStatus.OK)
    async markAsRead(
        @Param('id') id: string,
        @GetUser('id') userId: string,
        @GetUser('role') role: UserRole,
    ) {
        return this.notificationsService.markAsRead(id, userId, role);
    }

    @Patch('read-all')
    @HttpCode(HttpStatus.OK)
    async markAllAsRead(
        @GetUser('id') userId: string,
        @GetUser('role') role: UserRole,
    ) {
        return this.notificationsService.markAllAsRead(userId, userId, role);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async deleteNotification(
        @Param('id') id: string,
        @GetUser('id') userId: string,
        @GetUser('role') role: UserRole,
    ) {
        return this.notificationsService.deleteNotification(id, userId, role);
    }

    @Delete()
    @HttpCode(HttpStatus.OK)
    async deleteAllNotifications(
        @GetUser('id') userId: string,
        @GetUser('role') role: UserRole,
    ) {
        return this.notificationsService.deleteAllNotifications(userId, userId, role);
    }
}
