import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class ReturnBookDto {
    @IsOptional()
    returnCondition?: Record<string, unknown>; // JSON object for condition assessment

    @IsNumber()
    @Min(0)
    @IsOptional()
    damageCharge?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}
