import { IsOptional, IsBoolean, IsEnum, IsNumber, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationCategory } from '@prisma/client';

export class QueryNotificationsDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    read?: boolean;

    @IsOptional()
    @IsEnum(NotificationCategory)
    category?: NotificationCategory;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';
}
