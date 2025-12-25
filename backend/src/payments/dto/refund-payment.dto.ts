import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class RefundPaymentDto {
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    refundAmount: number;

    @IsNotEmpty()
    @IsString()
    refundReason: string;
}
