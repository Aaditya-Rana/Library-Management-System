import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsOptional()
    dateOfBirth?: Date;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}
