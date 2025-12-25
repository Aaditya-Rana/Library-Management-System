import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
    let controller: ReportsController;
    let service: ReportsService;

    const mockReportsService = {
        getDashboardStats: jest.fn(),
        getActiveUsers: jest.fn(),
        getOverdueUsers: jest.fn(),
        getPopularBooks: jest.fn(),
        getLowCirculationBooks: jest.fn(),
        getCategoryDistribution: jest.fn(),
        getCirculationStats: jest.fn(),
        getFinancialSummary: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ReportsController],
            providers: [
                {
                    provide: ReportsService,
                    useValue: mockReportsService,
                },
            ],
        }).compile();

        controller = module.get<ReportsController>(ReportsController);
        service = module.get<ReportsService>(ReportsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getDashboard', () => {
        it('should call getDashboardStats', async () => {
            const mockResult = {
                success: true,
                data: { overview: {}, financial: {}, today: {} },
            };
            mockReportsService.getDashboardStats.mockResolvedValue(mockResult);

            const result = await controller.getDashboard();

            expect(service.getDashboardStats).toHaveBeenCalled();
            expect(result).toEqual(mockResult);
        });
    });

    describe('getActiveUsers', () => {
        it('should call getActiveUsers with query parameters', async () => {
            const mockResult = { success: true, data: { users: [] } };
            const queryDto = { limit: 10, startDate: '2024-01-01' };
            mockReportsService.getActiveUsers.mockResolvedValue(mockResult);

            const result = await controller.getActiveUsers(queryDto);

            expect(service.getActiveUsers).toHaveBeenCalledWith(queryDto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('getOverdueUsers', () => {
        it('should call getOverdueUsers', async () => {
            const mockResult = {
                success: true,
                data: { overdueUsers: [], totalOverdueCount: 0 },
            };
            mockReportsService.getOverdueUsers.mockResolvedValue(mockResult);

            const result = await controller.getOverdueUsers();

            expect(service.getOverdueUsers).toHaveBeenCalled();
            expect(result).toEqual(mockResult);
        });
    });

    describe('getPopularBooks', () => {
        it('should call getPopularBooks with query parameters', async () => {
            const mockResult = { success: true, data: { books: [] } };
            const queryDto = { limit: 5, category: 'Fiction' };
            mockReportsService.getPopularBooks.mockResolvedValue(mockResult);

            const result = await controller.getPopularBooks(queryDto);

            expect(service.getPopularBooks).toHaveBeenCalledWith(queryDto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('getLowCirculationBooks', () => {
        it('should call getLowCirculationBooks with limit', async () => {
            const mockResult = { success: true, data: { books: [] } };
            mockReportsService.getLowCirculationBooks.mockResolvedValue(mockResult);

            const result = await controller.getLowCirculationBooks(10);

            expect(service.getLowCirculationBooks).toHaveBeenCalledWith(10);
            expect(result).toEqual(mockResult);
        });
    });

    describe('getCategoryDistribution', () => {
        it('should call getCategoryDistribution', async () => {
            const mockResult = { success: true, data: { categories: [] } };
            mockReportsService.getCategoryDistribution.mockResolvedValue(mockResult);

            const result = await controller.getCategoryDistribution();

            expect(service.getCategoryDistribution).toHaveBeenCalled();
            expect(result).toEqual(mockResult);
        });
    });

    describe('getCirculationStats', () => {
        it('should call getCirculationStats with query parameters', async () => {
            const mockResult = { success: true, data: { circulation: [] } };
            const queryDto = { groupBy: 'MONTH' as any };
            mockReportsService.getCirculationStats.mockResolvedValue(mockResult);

            const result = await controller.getCirculationStats(queryDto);

            expect(service.getCirculationStats).toHaveBeenCalledWith(queryDto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('getFinancialSummary', () => {
        it('should call getFinancialSummary with query parameters', async () => {
            const mockResult = { success: true, data: {} };
            const queryDto = { startDate: '2024-01-01' };
            mockReportsService.getFinancialSummary.mockResolvedValue(mockResult);

            const result = await controller.getFinancialSummary(queryDto);

            expect(service.getFinancialSummary).toHaveBeenCalledWith(queryDto);
            expect(result).toEqual(mockResult);
        });
    });
});
