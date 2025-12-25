import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../common/services/prisma.service';
import { SettingCategory, SettingDataType } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SettingsService', () => {
    let service: SettingsService;

    const mockPrismaService = {
        setting: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            upsert: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SettingsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<SettingsService>(SettingsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllSettings', () => {
        it('should return all settings', async () => {
            const mockSettings = [
                {
                    id: '1',
                    key: 'library.name',
                    value: 'Test Library',
                    category: SettingCategory.LIBRARY,
                    dataType: SettingDataType.STRING,
                    description: 'Library name',
                    isEditable: true,
                    defaultValue: 'Test Library',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            mockPrismaService.setting.findMany.mockResolvedValue(mockSettings);

            const result = await service.getAllSettings();

            expect(result.success).toBe(true);
            expect(result.data.settings).toHaveLength(1);
            expect(mockPrismaService.setting.findMany).toHaveBeenCalled();
        });

        it('should filter settings by category', async () => {
            mockPrismaService.setting.findMany.mockResolvedValue([]);

            await service.getAllSettings(SettingCategory.LIBRARY);

            expect(mockPrismaService.setting.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { category: SettingCategory.LIBRARY },
                }),
            );
        });
    });

    describe('getSetting', () => {
        it('should return a specific setting', async () => {
            const mockSetting = {
                id: '1',
                key: 'library.name',
                value: 'Test Library',
                category: SettingCategory.LIBRARY,
                dataType: SettingDataType.STRING,
                description: 'Library name',
                isEditable: true,
                defaultValue: 'Test Library',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaService.setting.findUnique.mockResolvedValue(mockSetting);

            const result = await service.getSetting('library.name');

            expect(result.success).toBe(true);
            expect(result.data.setting.key).toBe('library.name');
        });

        it('should throw NotFoundException if setting not found', async () => {
            mockPrismaService.setting.findUnique.mockResolvedValue(null);

            await expect(service.getSetting('invalid.key')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('updateSetting', () => {
        it('should update a setting successfully', async () => {
            const mockSetting = {
                id: '1',
                key: 'fines.per_day_amount',
                value: '5',
                category: SettingCategory.FINES,
                dataType: SettingDataType.NUMBER,
                description: 'Fine per day',
                isEditable: true,
                defaultValue: '5',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaService.setting.findUnique.mockResolvedValue(mockSetting);
            mockPrismaService.setting.update.mockResolvedValue({
                ...mockSetting,
                value: '10',
            });

            const result = await service.updateSetting('fines.per_day_amount', {
                value: 10,
            });

            expect(result.success).toBe(true);
            expect(result.message).toBe('Setting updated successfully');
        });

        it('should throw NotFoundException if setting not found', async () => {
            mockPrismaService.setting.findUnique.mockResolvedValue(null);

            await expect(
                service.updateSetting('invalid.key', { value: 'test' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if setting is not editable', async () => {
            const mockSetting = {
                id: '1',
                key: 'system.version',
                value: '1.0',
                category: SettingCategory.SYSTEM,
                dataType: SettingDataType.STRING,
                description: 'Version',
                isEditable: false,
                defaultValue: '1.0',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaService.setting.findUnique.mockResolvedValue(mockSetting);

            await expect(
                service.updateSetting('system.version', { value: '2.0' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should validate value type matches dataType', async () => {
            const mockSetting = {
                id: '1',
                key: 'fines.per_day_amount',
                value: '5',
                category: SettingCategory.FINES,
                dataType: SettingDataType.NUMBER,
                description: 'Fine per day',
                isEditable: true,
                defaultValue: '5',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaService.setting.findUnique.mockResolvedValue(mockSetting);

            await expect(
                service.updateSetting('fines.per_day_amount', { value: 'invalid' }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('resetToDefault', () => {
        it('should reset setting to default value', async () => {
            const mockSetting = {
                id: '1',
                key: 'library.name',
                value: 'Changed Name',
                category: SettingCategory.LIBRARY,
                dataType: SettingDataType.STRING,
                description: 'Library name',
                isEditable: true,
                defaultValue: 'Default Library',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaService.setting.findUnique.mockResolvedValue(mockSetting);
            mockPrismaService.setting.update.mockResolvedValue({
                ...mockSetting,
                value: 'Default Library',
            });

            const result = await service.resetToDefault('library.name');

            expect(result.success).toBe(true);
            expect(result.message).toBe('Setting reset to default successfully');
        });

        it('should throw NotFoundException if setting not found', async () => {
            mockPrismaService.setting.findUnique.mockResolvedValue(null);

            await expect(service.resetToDefault('invalid.key')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw BadRequestException if setting cannot be reset', async () => {
            const mockSetting = {
                id: '1',
                key: 'system.version',
                value: '1.0',
                category: SettingCategory.SYSTEM,
                dataType: SettingDataType.STRING,
                description: 'Version',
                isEditable: false,
                defaultValue: '1.0',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaService.setting.findUnique.mockResolvedValue(mockSetting);

            await expect(service.resetToDefault('system.version')).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('seedDefaultSettings', () => {
        it('should seed default settings', async () => {
            mockPrismaService.setting.upsert.mockResolvedValue({});

            const result = await service.seedDefaultSettings();

            expect(result.success).toBe(true);
            expect(result.message).toBe('Default settings seeded successfully');
            expect(mockPrismaService.setting.upsert).toHaveBeenCalled();
        });
    });
});
