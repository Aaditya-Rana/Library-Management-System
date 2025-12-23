import {
    IsEmail,
    IsString,
    MinLength,
    IsOptional,
    IsEnum,
    IsDateString,
} from 'class-validator';
import { UserRole, MembershipType } from '@prisma/client';

export class CreateUserDto {
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

    @IsDateString()
    @IsOptional()
    dateOfBirth?: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole = UserRole.USER;

    @IsEnum(MembershipType)
    @IsOptional()
    membershipType?: MembershipType = MembershipType.FREE;
}
