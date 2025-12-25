import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { SettingCategory, SettingDataType } from '@prisma/client';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get all settings or filter by category
     */
    async getAllSettings(category?: SettingCategory) {
        const where = category ? { category } : {};

        const settings = await this.prisma.setting.findMany({
            where,
            orderBy: [{ category: 'asc' }, { key: 'asc' }],
        });

        return {
            success: true,
            data: {
                settings: settings.map((s) => ({
                    ...s,
                    value: this.parseValue(s.value, s.dataType),
                })),
            },
        };
    }

    /**
     * Get a specific setting by key
     */
    async getSetting(key: string) {
        const setting = await this.prisma.setting.findUnique({
            where: { key },
        });

        if (!setting) {
            throw new NotFoundException(`Setting with key '${key}' not found`);
        }

        return {
            success: true,
            data: {
                setting: {
                    ...setting,
                    value: this.parseValue(setting.value, setting.dataType),
                },
            },
        };
    }

    /**
     * Update a setting value
     */
    async updateSetting(key: string, updateDto: UpdateSettingDto) {
        const setting = await this.prisma.setting.findUnique({
            where: { key },
        });

        if (!setting) {
            throw new NotFoundException(`Setting with key '${key}' not found`);
        }

        if (!setting.isEditable) {
            throw new BadRequestException(`Setting '${key}' is not editable`);
        }

        // Validate value type matches expected dataType
        this.validateValue(updateDto.value, setting.dataType);

        // Convert value to string for storage
        const stringValue = this.stringifyValue(updateDto.value, setting.dataType);

        const updatedSetting = await this.prisma.setting.update({
            where: { key },
            data: { value: stringValue },
        });

        return {
            success: true,
            message: 'Setting updated successfully',
            data: {
                setting: {
                    ...updatedSetting,
                    value: this.parseValue(updatedSetting.value, updatedSetting.dataType),
                },
            },
        };
    }

    /**
     * Reset setting to default value
     */
    async resetToDefault(key: string) {
        const setting = await this.prisma.setting.findUnique({
            where: { key },
        });

        if (!setting) {
            throw new NotFoundException(`Setting with key '${key}' not found`);
        }

        if (!setting.isEditable) {
            throw new BadRequestException(`Setting '${key}' cannot be reset`);
        }

        const updatedSetting = await this.prisma.setting.update({
            where: { key },
            data: { value: setting.defaultValue },
        });

        return {
            success: true,
            message: 'Setting reset to default successfully',
            data: {
                setting: {
                    ...updatedSetting,
                    value: this.parseValue(updatedSetting.value, updatedSetting.dataType),
                },
            },
        };
    }

    /**
     * Seed default settings (called during app initialization)
     */
    async seedDefaultSettings() {
        const defaultSettings = [
            // Library Settings
            {
                key: 'library.name',
                value: 'City Public Library',
                category: SettingCategory.LIBRARY,
                dataType: SettingDataType.STRING,
                description: 'Library name',
                isEditable: true,
                defaultValue: 'City Public Library',
            },
            {
                key: 'library.address',
                value: '123 Main Street, City, State 12345',
                category: SettingCategory.LIBRARY,
                dataType: SettingDataType.STRING,
                description: 'Library physical address',
                isEditable: true,
                defaultValue: '123 Main Street, City, State 12345',
            },
            {
                key: 'library.phone',
                value: '+1-234-567-8900',
                category: SettingCategory.LIBRARY,
                dataType: SettingDataType.STRING,
                description: 'Library contact phone',
                isEditable: true,
                defaultValue: '+1-234-567-8900',
            },
            {
                key: 'library.email',
                value: 'info@library.com',
                category: SettingCategory.LIBRARY,
                dataType: SettingDataType.STRING,
                description: 'Library contact email',
                isEditable: true,
                defaultValue: 'info@library.com',
            },
            // Loan Settings
            {
                key: 'loans.default_period_days',
                value: '14',
                category: SettingCategory.LOANS,
                dataType: SettingDataType.NUMBER,
                description: 'Default loan period in days',
                isEditable: true,
                defaultValue: '14',
            },
            {
                key: 'loans.max_renewals',
                value: '2',
                category: SettingCategory.LOANS,
                dataType: SettingDataType.NUMBER,
                description: 'Maximum number of renewals allowed',
                isEditable: true,
                defaultValue: '2',
            },
            {
                key: 'loans.max_books_per_user',
                value: '5',
                category: SettingCategory.LOANS,
                dataType: SettingDataType.NUMBER,
                description: 'Maximum books a user can borrow',
                isEditable: true,
                defaultValue: '5',
            },
            // Fine Settings
            {
                key: 'fines.per_day_amount',
                value: '5',
                category: SettingCategory.FINES,
                dataType: SettingDataType.NUMBER,
                description: 'Fine amount per day (in currency)',
                isEditable: true,
                defaultValue: '5',
            },
            {
                key: 'fines.grace_period_days',
                value: '1',
                category: SettingCategory.FINES,
                dataType: SettingDataType.NUMBER,
                description: 'Grace period before fines start',
                isEditable: true,
                defaultValue: '1',
            },
            {
                key: 'fines.max_fine_amount',
                value: '500',
                category: SettingCategory.FINES,
                dataType: SettingDataType.NUMBER,
                description: 'Maximum fine amount cap',
                isEditable: true,
                defaultValue: '500',
            },
            // Membership Settings
            {
                key: 'membership.free.book_limit',
                value: '3',
                category: SettingCategory.MEMBERSHIP,
                dataType: SettingDataType.NUMBER,
                description: 'Book limit for free membership',
                isEditable: true,
                defaultValue: '3',
            },
            {
                key: 'membership.premium.book_limit',
                value: '10',
                category: SettingCategory.MEMBERSHIP,
                dataType: SettingDataType.NUMBER,
                description: 'Book limit for premium membership',
                isEditable: true,
                defaultValue: '10',
            },
            {
                key: 'membership.premium.loan_period_days',
                value: '21',
                category: SettingCategory.MEMBERSHIP,
                dataType: SettingDataType.NUMBER,
                description: 'Loan period for premium members',
                isEditable: true,
                defaultValue: '21',
            },
            // System Settings
            {
                key: 'system.timezone',
                value: 'UTC',
                category: SettingCategory.SYSTEM,
                dataType: SettingDataType.STRING,
                description: 'System timezone',
                isEditable: true,
                defaultValue: 'UTC',
            },
            {
                key: 'system.date_format',
                value: 'YYYY-MM-DD',
                category: SettingCategory.SYSTEM,
                dataType: SettingDataType.STRING,
                description: 'Date display format',
                isEditable: true,
                defaultValue: 'YYYY-MM-DD',
            },
            {
                key: 'system.currency',
                value: 'USD',
                category: SettingCategory.SYSTEM,
                dataType: SettingDataType.STRING,
                description: 'Currency code',
                isEditable: true,
                defaultValue: 'USD',
            },
            {
                key: 'system.email_notifications',
                value: 'true',
                category: SettingCategory.SYSTEM,
                dataType: SettingDataType.BOOLEAN,
                description: 'Enable email notifications',
                isEditable: true,
                defaultValue: 'true',
            },
        ];

        // Upsert settings (create if not exists, skip if exists)
        for (const setting of defaultSettings) {
            await this.prisma.setting.upsert({
                where: { key: setting.key },
                update: {}, // Don't update if exists
                create: setting,
            });
        }

        return {
            success: true,
            message: 'Default settings seeded successfully',
        };
    }

    /**
     * Helper: Parse stored string value based on dataType
     */
    private parseValue(value: string, dataType: SettingDataType): unknown {
        switch (dataType) {
            case SettingDataType.NUMBER:
                return parseFloat(value);
            case SettingDataType.BOOLEAN:
                return value.toLowerCase() === 'true';
            case SettingDataType.JSON:
                try {
                    return JSON.parse(value);
                } catch {
                    return value;
                }
            case SettingDataType.STRING:
            default:
                return value;
        }
    }

    /**
     * Helper: Convert value to string for storage
     */
    private stringifyValue(value: unknown, dataType: SettingDataType): string {
        if (dataType === SettingDataType.JSON) {
            return JSON.stringify(value);
        }
        return String(value);
    }

    /**
     * Helper: Validate value type matches expected dataType
     */
    private validateValue(value: unknown, expectedType: SettingDataType): void {
        switch (expectedType) {
            case SettingDataType.NUMBER:
                if (typeof value !== 'number' || isNaN(value)) {
                    throw new BadRequestException('Value must be a valid number');
                }
                break;
            case SettingDataType.BOOLEAN:
                if (typeof value !== 'boolean') {
                    throw new BadRequestException('Value must be a boolean');
                }
                break;
            case SettingDataType.JSON:
                if (typeof value !== 'object') {
                    throw new BadRequestException('Value must be a valid JSON object');
                }
                break;
            case SettingDataType.STRING:
                if (typeof value !== 'string') {
                    throw new BadRequestException('Value must be a string');
                }
                break;
        }
    }
}
