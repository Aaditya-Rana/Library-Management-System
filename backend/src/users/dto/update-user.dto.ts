import {
    IsString,
    IsOptional,
    IsEnum,
    IsDateString,
    IsUrl,
} from 'class-validator';
import { MembershipType } from '@prisma/client';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsDateString()
    @IsOptional()
    dateOfBirth?: string;

    @IsUrl()
    @IsOptional()
    profileImageUrl?: string;

    @IsEnum(MembershipType)
    @IsOptional()
    membershipType?: MembershipType;
}
