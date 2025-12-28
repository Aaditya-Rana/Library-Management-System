import { IsDateString, IsOptional } from 'class-validator';

export class RenewTransactionDto {
    @IsDateString()
    @IsOptional()
    newDueDate?: string;
}
