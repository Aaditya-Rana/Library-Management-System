import { IsNotEmpty, IsString, IsEnum, MaxLength, IsUUID } from 'class-validator';
import { NotificationType, NotificationCategory } from '@prisma/client';

export class CreateNotificationDto {
    @IsNotEmpty()
    @IsUUID()
    userId: string;

    @IsNotEmpty()
    @IsEnum(NotificationType)
    type: NotificationType;

    @IsNotEmpty()
    @IsEnum(NotificationCategory)
    category: NotificationCategory;

    @IsNotEmpty()
    @IsString()
    @MaxLength(200)
    title: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(1000)
    message: string;
}
