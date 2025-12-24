import { IsNumber, Min, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class PayFineDto {
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    amount: number;

    @IsEnum(PaymentMethod)
    @IsNotEmpty()
    paymentMethod: PaymentMethod;

    @IsString()
    @IsOptional()
    transactionId?: string;
}
