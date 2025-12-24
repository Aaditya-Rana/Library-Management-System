import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryBooksDto {
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
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    genre?: string;

    @IsOptional()
    @IsString()
    language?: string;

    @IsOptional()
    @IsIn(['ACTIVE', 'INACTIVE'])
    status?: string;

    @IsOptional()
    @IsIn(['available', 'unavailable'])
    availability?: string;

    // Search
    @IsOptional()
    @IsString()
    search?: string; // Search in title, author, ISBN

    // Sorting
    @IsOptional()
    @IsIn(['title', 'author', 'publicationYear', 'bookValue', 'createdAt'])
    sortBy?: string;

    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'asc';
}
