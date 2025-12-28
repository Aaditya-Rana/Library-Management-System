import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsDateString,
} from 'class-validator';

export class IssueBookDto {
    @IsString()
    @IsNotEmpty()
    bookId: string;

    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsDateString()
    @IsOptional()
    dueDate?: string;

    @IsBoolean()
    @IsOptional()
    isHomeDelivery?: boolean;

    @IsString()
    @IsOptional()
    notes?: string;
}
