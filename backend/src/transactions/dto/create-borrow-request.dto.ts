import { IsNotEmpty, IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateBorrowRequestDto {
    @IsNotEmpty()
    @IsUUID()
    bookId: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}
