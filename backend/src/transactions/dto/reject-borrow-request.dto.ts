import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectBorrowRequestDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(500)
    rejectionReason: string;
}
