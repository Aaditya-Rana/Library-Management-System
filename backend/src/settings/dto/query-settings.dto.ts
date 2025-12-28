import { IsOptional, IsEnum } from 'class-validator';
import { SettingCategory } from '@prisma/client';

export class QuerySettingsDto {
    @IsOptional()
    @IsEnum(SettingCategory)
    category?: SettingCategory;
}
