import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole, UserStatus, MembershipType } from '@prisma/client';

describe('UsersController', () => {
    let controller: UsersController;
    let service: UsersService;

    const mockUsersService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        approveUser: jest.fn(),
        suspendUser: jest.fn(),
        activateUser: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);
        service = module.get<UsersService>(UsersService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a new user', async () => {
            const createUserDto = {
                email: 'newuser@example.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'User',
            };

            const expectedResult = {
                success: true,
                message: 'User created successfully',
                data: {
                    user: {
                        id: '1',
                        email: createUserDto.email,
                        firstName: createUserDto.firstName,
                        lastName: createUserDto.lastName,
                        role: UserRole.USER,
                        status: UserStatus.ACTIVE,
                        membershipType: MembershipType.FREE,
                        createdAt: new Date(),
                    },
                },
            };

            mockUsersService.create.mockResolvedValue(expectedResult);

            const result = await controller.create(createUserDto);

            expect(result).toEqual(expectedResult);
            expect(service.create).toHaveBeenCalledWith(createUserDto);
        });
    });

    describe('findAll', () => {
        it('should return paginated users', async () => {
            const queryDto = {
                page: 1,
                limit: 20,
            };

            const expectedResult = {
                success: true,
                data: {
                    users: [],
                    pagination: {
                        page: 1,
                        limit: 20,
                        total: 0,
                        totalPages: 0,
                    },
                },
            };

            mockUsersService.findAll.mockResolvedValue(expectedResult);

            const result = await controller.findAll(queryDto);

            expect(result).toEqual(expectedResult);
            expect(service.findAll).toHaveBeenCalledWith(queryDto);
        });
    });

    describe('getCurrentUser', () => {
        it('should return current user profile', async () => {
            const userId = '1';
            const expectedResult = {
                success: true,
                data: {
                    user: {
                        id: userId,
                        email: 'user@example.com',
                        firstName: 'Test',
                        lastName: 'User',
                        role: UserRole.USER,
                        status: UserStatus.ACTIVE,
                        stats: {
                            totalBorrowed: 0,
                            currentlyBorrowed: 0,
                            overdueBooks: 0,
                            totalFinesPaid: 0,
                        },
                    },
                },
            };

            mockUsersService.findOne.mockResolvedValue(expectedResult);

            const result = await controller.getCurrentUser(userId);

            expect(result).toEqual(expectedResult);
            expect(service.findOne).toHaveBeenCalledWith(userId);
        });
    });

    describe('updateCurrentUser', () => {
        it('should update current user profile', async () => {
            const userId = '1';
            const updateUserDto = {
                firstName: 'Updated',
                lastName: 'Name',
            };

            const expectedResult = {
                success: true,
                message: 'User updated successfully',
                data: {
                    user: {
                        id: userId,
                        email: 'user@example.com',
                        firstName: 'Updated',
                        lastName: 'Name',
                        phone: null,
                        dateOfBirth: null,
                        profileImageUrl: null,
                        membershipType: MembershipType.FREE,
                        updatedAt: new Date(),
                    },
                },
            };

            mockUsersService.update.mockResolvedValue(expectedResult);

            const result = await controller.updateCurrentUser(
                userId,
                UserRole.USER,
                updateUserDto,
            );

            expect(result).toEqual(expectedResult);
            expect(service.update).toHaveBeenCalledWith(
                userId,
                updateUserDto,
                userId,
                UserRole.USER,
            );
        });
    });

    describe('findOne', () => {
        it('should return user by id for admin', async () => {
            const userId = '2';
            const requestingUserId = '1';
            const role = UserRole.ADMIN;

            const expectedResult = {
                success: true,
                data: {
                    user: {
                        id: userId,
                        email: 'user2@example.com',
                        firstName: 'User',
                        lastName: 'Two',
                        role: UserRole.USER,
                        status: UserStatus.ACTIVE,
                    },
                },
            };

            mockUsersService.findOne.mockResolvedValue(expectedResult);

            const result = await controller.findOne(userId, requestingUserId, role);

            expect(result).toEqual(expectedResult);
            expect(service.findOne).toHaveBeenCalledWith(userId);
        });

        it('should return own profile for regular user trying to access other user', async () => {
            const userId = '2';
            const requestingUserId = '1';
            const role = UserRole.USER;

            const expectedResult = {
                success: true,
                data: {
                    user: {
                        id: requestingUserId,
                        email: 'user1@example.com',
                        firstName: 'User',
                        lastName: 'One',
                        role: UserRole.USER,
                        status: UserStatus.ACTIVE,
                    },
                },
            };

            mockUsersService.findOne.mockResolvedValue(expectedResult);

            const result = await controller.findOne(userId, requestingUserId, role);

            expect(result).toEqual(expectedResult);
            expect(service.findOne).toHaveBeenCalledWith(requestingUserId);
        });
    });

    describe('update', () => {
        it('should update user', async () => {
            const userId = '1';
            const updateUserDto = {
                firstName: 'Updated',
            };

            const expectedResult = {
                success: true,
                message: 'User updated successfully',
                data: {
                    user: {
                        id: userId,
                        firstName: 'Updated',
                        updatedAt: new Date(),
                    },
                },
            };

            mockUsersService.update.mockResolvedValue(expectedResult);

            const result = await controller.update(
                userId,
                updateUserDto,
                userId,
                UserRole.USER,
            );

            expect(result).toEqual(expectedResult);
            expect(service.update).toHaveBeenCalledWith(
                userId,
                updateUserDto,
                userId,
                UserRole.USER,
            );
        });
    });

    describe('remove', () => {
        it('should delete user', async () => {
            const userId = '2';
            const requestingUserId = '1';

            const expectedResult = {
                success: true,
                message: 'User deleted successfully',
            };

            mockUsersService.remove.mockResolvedValue(expectedResult);

            const result = await controller.remove(userId, requestingUserId);

            expect(result).toEqual(expectedResult);
            expect(service.remove).toHaveBeenCalledWith(userId, requestingUserId);
        });
    });

    describe('approve', () => {
        it('should approve user', async () => {
            const userId = '1';

            const expectedResult = {
                success: true,
                message: 'User approved successfully',
                data: {
                    user: {
                        id: userId,
                        status: UserStatus.ACTIVE,
                    },
                },
            };

            mockUsersService.approveUser.mockResolvedValue(expectedResult);

            const result = await controller.approve(userId);

            expect(result).toEqual(expectedResult);
            expect(service.approveUser).toHaveBeenCalledWith(userId);
        });
    });

    describe('suspend', () => {
        it('should suspend user with reason', async () => {
            const userId = '1';
            const suspendUserDto = {
                reason: 'Violation of terms',
            };

            const expectedResult = {
                success: true,
                message: 'User suspended successfully',
            };

            mockUsersService.suspendUser.mockResolvedValue(expectedResult);

            const result = await controller.suspend(userId, suspendUserDto);

            expect(result).toEqual(expectedResult);
            expect(service.suspendUser).toHaveBeenCalledWith(
                userId,
                suspendUserDto.reason,
            );
        });

        it('should suspend user without reason', async () => {
            const userId = '1';
            const suspendUserDto = {};

            const expectedResult = {
                success: true,
                message: 'User suspended successfully',
            };

            mockUsersService.suspendUser.mockResolvedValue(expectedResult);

            const result = await controller.suspend(userId, suspendUserDto);

            expect(result).toEqual(expectedResult);
            expect(service.suspendUser).toHaveBeenCalledWith(userId, undefined);
        });
    });

    describe('activate', () => {
        it('should activate user', async () => {
            const userId = '1';

            const expectedResult = {
                success: true,
                message: 'User activated successfully',
                data: {
                    user: {
                        id: userId,
                        status: UserStatus.ACTIVE,
                    },
                },
            };

            mockUsersService.activateUser.mockResolvedValue(expectedResult);

            const result = await controller.activate(userId);

            expect(result).toEqual(expectedResult);
            expect(service.activateUser).toHaveBeenCalledWith(userId);
        });
    });
});
