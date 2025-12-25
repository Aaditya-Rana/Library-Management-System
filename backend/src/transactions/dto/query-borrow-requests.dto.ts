import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BorrowRequestStatus } from '@prisma/client';

export class QueryBorrowRequestsDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit?: number = 20;

    @IsOptional()
    @IsEnum(BorrowRequestStatus)
    status?: BorrowRequestStatus;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsString()
    bookId?: string;

    @IsOptional()
    @IsString()
    sortBy?: string = 'requestDate';

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';
}
