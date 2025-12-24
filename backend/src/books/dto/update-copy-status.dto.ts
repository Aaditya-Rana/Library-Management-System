import { IsEnum, IsString, IsOptional } from 'class-validator';
import { BookStatus } from '@prisma/client';

export class UpdateCopyStatusDto {
    @IsEnum(BookStatus)
    status: BookStatus;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
