import {
    IsOptional,
    IsString,
    IsInt,
    Min,
    IsIn,
    IsDateString,
    IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTransactionsDto {
    // Pagination
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit?: number = 10;

    // Filtering
    @IsOptional()
    @IsIn(['ISSUED', 'RETURNED', 'OVERDUE', 'RENEWED', 'LOST'])
    status?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsString()
    bookId?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    overdue?: boolean;

    // Date range
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    // Sorting
    @IsOptional()
    @IsIn(['issueDate', 'dueDate', 'returnDate', 'createdAt'])
    sortBy?: string;

    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';
}
