import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SettingCategory } from '@prisma/client';

describe('SettingsController', () => {
    let controller: SettingsController;
    let service: SettingsService;

    const mockSettingsService = {
        getAllSettings: jest.fn(),
        getSetting: jest.fn(),
        updateSetting: jest.fn(),
        resetToDefault: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SettingsController],
            providers: [
                {
                    provide: SettingsService,
                    useValue: mockSettingsService,
                },
            ],
        }).compile();

        controller = module.get<SettingsController>(SettingsController);
        service = module.get<SettingsService>(SettingsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllSettings', () => {
        it('should call getAllSettings without category', async () => {
            const mockResult = { success: true, data: { settings: [] } };
            mockSettingsService.getAllSettings.mockResolvedValue(mockResult);

            const result = await controller.getAllSettings({});

            expect(service.getAllSettings).toHaveBeenCalledWith(undefined);
            expect(result).toEqual(mockResult);
        });

        it('should call getAllSettings with category filter', async () => {
            const mockResult = { success: true, data: { settings: [] } };
            mockSettingsService.getAllSettings.mockResolvedValue(mockResult);

            const result = await controller.getAllSettings({
                category: SettingCategory.LIBRARY,
            });

            expect(service.getAllSettings).toHaveBeenCalledWith(
                SettingCategory.LIBRARY,
            );
            expect(result).toEqual(mockResult);
        });
    });

    describe('getSetting', () => {
        it('should call getSetting with key', async () => {
            const mockResult = { success: true, data: { setting: {} } };
            mockSettingsService.getSetting.mockResolvedValue(mockResult);

            const result = await controller.getSetting('library.name');

            expect(service.getSetting).toHaveBeenCalledWith('library.name');
            expect(result).toEqual(mockResult);
        });
    });

    describe('updateSetting', () => {
        it('should call updateSetting with key and value', async () => {
            const mockResult = { success: true, message: 'Updated', data: {} };
            const updateDto = { value: 'New Value' };
            mockSettingsService.updateSetting.mockResolvedValue(mockResult);

            const result = await controller.updateSetting('library.name', updateDto);

            expect(service.updateSetting).toHaveBeenCalledWith(
                'library.name',
                updateDto,
            );
            expect(result).toEqual(mockResult);
        });
    });

    describe('resetToDefault', () => {
        it('should call resetToDefault with key', async () => {
            const mockResult = { success: true, message: 'Reset', data: {} };
            mockSettingsService.resetToDefault.mockResolvedValue(mockResult);

            const result = await controller.resetToDefault('library.name');

            expect(service.resetToDefault).toHaveBeenCalledWith('library.name');
            expect(result).toEqual(mockResult);
        });
    });
});
