import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsInt,
    Min,
    Max,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^(?:\d{10}|\d{13})$/, {
        message: 'ISBN must be either 10 or 13 digits',
    })
    isbn: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(500)
    title: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(200)
    author: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    publisher?: string;

    @IsInt()
    @IsOptional()
    @Min(1000)
    @Max(new Date().getFullYear() + 1)
    publicationYear?: number;

    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(100)
    category: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(100)
    genre: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    language?: string;

    @IsInt()
    @IsOptional()
    @Min(1)
    @Type(() => Number)
    totalCopies?: number;

    @IsInt()
    @IsOptional()
    @Min(0)
    @Type(() => Number)
    availableCopies?: number;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price?: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    @Type(() => Number)
    bookValue: number;

    @IsString()
    @IsOptional()
    @MaxLength(5000)
    description?: string;

    @IsString()
    @IsOptional()
    coverImageUrl?: string;
}
