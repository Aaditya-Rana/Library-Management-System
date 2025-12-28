import { IsNotEmpty, IsNumber, IsOptional, IsEnum, IsString, IsUUID, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class RecordPaymentDto {
    @IsOptional()
    @IsUUID()
    transactionId?: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    amount: number;

    @IsNotEmpty()
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @IsOptional()
    @IsNumber()
    @Min(0)
    lateFee?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    securityDeposit?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    damageCharge?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}
