import { IsString, IsOptional, IsEnum } from 'class-validator';
import { BookCondition } from '@prisma/client';

export class UpdateBookCopyDto {
    @IsString()
    @IsOptional()
    shelfLocation?: string;

    @IsString()
    @IsOptional()
    section?: string;

    @IsEnum(BookCondition)
    @IsOptional()
    condition?: BookCondition;

    @IsString()
    @IsOptional()
    conditionNotes?: string;

    @IsOptional()
    conditionPhotos?: string[]; // Array of image URLs
}
