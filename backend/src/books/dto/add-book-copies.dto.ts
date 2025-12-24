import { IsInt, Min, Max, IsString, IsOptional } from 'class-validator';

export class AddBookCopiesDto {
    @IsInt()
    @Min(1)
    @Max(100)
    numberOfCopies: number;

    @IsString()
    @IsOptional()
    startingCopyNumber?: string;

    @IsString()
    @IsOptional()
    shelfLocation?: string;

    @IsString()
    @IsOptional()
    section?: string;
}
