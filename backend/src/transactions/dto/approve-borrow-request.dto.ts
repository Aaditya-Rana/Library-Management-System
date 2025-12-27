import { IsString, IsOptional, IsUUID, IsDateString, MaxLength } from 'class-validator';

export class ApproveBorrowRequestDto {
    @IsOptional()
    @IsUUID()
    bookCopyId?: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}
