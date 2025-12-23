import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../common/services/prisma.service';
import {
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { UserRole, UserStatus, MembershipType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
    let service: UsersService;

    const mockPrismaService = {
        user: {
            count: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        transaction: {
            count: jest.fn(),
        },
        payment: {
            aggregate: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return paginated users', async () => {
            const mockUsers = [
                {
                    id: '1',
                    email: 'user1@example.com',
                    firstName: 'User',
                    lastName: 'One',
                    role: UserRole.USER,
                    status: UserStatus.ACTIVE,
                    membershipType: MembershipType.FREE,
                    phone: null,
                    profileImageUrl: null,
                    membershipExpiry: null,
                    emailVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lastLoginAt: null,
                },
            ];

            mockPrismaService.user.count.mockResolvedValue(1);
            mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

            const result = await service.findAll({
                page: 1,
                limit: 20,
            });

            expect(result.success).toBe(true);
            expect(result.data.users).toEqual(mockUsers);
            expect(result.data.pagination).toEqual({
                page: 1,
                limit: 20,
                total: 1,
                totalPages: 1,
            });
        });

        it('should filter by role', async () => {
            mockPrismaService.user.count.mockResolvedValue(0);
            mockPrismaService.user.findMany.mockResolvedValue([]);

            await service.findAll({
                page: 1,
                limit: 20,
                role: UserRole.ADMIN,
            });

            expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        role: UserRole.ADMIN,
                    }),
                }),
            );
        });

        it('should filter by status', async () => {
            mockPrismaService.user.count.mockResolvedValue(0);
            mockPrismaService.user.findMany.mockResolvedValue([]);

            await service.findAll({
                page: 1,
                limit: 20,
                status: UserStatus.ACTIVE,
            });

            expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: UserStatus.ACTIVE,
                    }),
                }),
            );
        });

        it('should search by name or email', async () => {
            mockPrismaService.user.count.mockResolvedValue(0);
            mockPrismaService.user.findMany.mockResolvedValue([]);

            await service.findAll({
                page: 1,
                limit: 20,
                search: 'john',
            });

            expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            { firstName: { contains: 'john', mode: 'insensitive' } },
                            { lastName: { contains: 'john', mode: 'insensitive' } },
                            { email: { contains: 'john', mode: 'insensitive' } },
                        ]),
                    }),
                }),
            );
        });
    });

    describe('findOne', () => {
        it('should return user with stats', async () => {
            const mockUser = {
                id: '1',
                email: 'user@example.com',
                firstName: 'Test',
                lastName: 'User',
                phone: null,
                dateOfBirth: null,
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
                membershipType: MembershipType.FREE,
                membershipExpiry: null,
                profileImageUrl: null,
                emailVerified: true,
                twoFactorEnabled: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLoginAt: null,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.transaction.count.mockResolvedValue(0);
            mockPrismaService.payment.aggregate.mockResolvedValue({
                _sum: { lateFee: 0 },
            });

            const result = await service.findOne('1');

            expect(result.success).toBe(true);
            expect(result.data.user).toMatchObject(mockUser);
            expect(result.data.user.stats).toBeDefined();
        });

        it('should throw NotFoundException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.findOne('999')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('create', () => {
        it('should create user successfully', async () => {
            const createUserDto = {
                email: 'newuser@example.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'User',
            };

            const mockCreatedUser = {
                id: '1',
                email: createUserDto.email,
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
                membershipType: MembershipType.FREE,
                createdAt: new Date(),
            };

            mockPrismaService.user.findUnique.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

            const result = await service.create(createUserDto, UserRole.ADMIN);

            expect(result.success).toBe(true);
            expect(result.message).toBe('User created successfully');
            expect(result.data.user).toEqual(mockCreatedUser);
            expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
        });

        it('should throw ConflictException if email already exists', async () => {
            const createUserDto = {
                email: 'existing@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
            };

            mockPrismaService.user.findUnique.mockResolvedValue({
                id: '1',
                email: createUserDto.email,
            });

            await expect(service.create(createUserDto, UserRole.ADMIN)).rejects.toThrow(
                ConflictException,
            );
        });

        it('should allow SUPER_ADMIN to create ADMIN users', async () => {
            const createUserDto = {
                email: 'newadmin@example.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'Admin',
                role: UserRole.ADMIN,
            };

            const mockCreatedUser = {
                id: '1',
                email: createUserDto.email,
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
                membershipType: MembershipType.FREE,
                createdAt: new Date(),
            };

            mockPrismaService.user.findUnique.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

            const result = await service.create(createUserDto, UserRole.SUPER_ADMIN);

            expect(result.success).toBe(true);
            expect(result.data.user.role).toBe(UserRole.ADMIN);
        });

        it('should prevent ADMIN from creating SUPER_ADMIN users', async () => {
            const createUserDto = {
                email: 'newsuperadmin@example.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'SuperAdmin',
                role: UserRole.SUPER_ADMIN,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.create(createUserDto, UserRole.ADMIN)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should prevent ADMIN from creating other ADMIN users', async () => {
            const createUserDto = {
                email: 'newadmin@example.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'Admin',
                role: UserRole.ADMIN,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.create(createUserDto, UserRole.ADMIN)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should allow ADMIN to create LIBRARIAN users', async () => {
            const createUserDto = {
                email: 'newlibrarian@example.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'Librarian',
                role: UserRole.LIBRARIAN,
            };

            const mockCreatedUser = {
                id: '1',
                email: createUserDto.email,
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                role: UserRole.LIBRARIAN,
                status: UserStatus.ACTIVE,
                membershipType: MembershipType.FREE,
                createdAt: new Date(),
            };

            mockPrismaService.user.findUnique.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

            const result = await service.create(createUserDto, UserRole.ADMIN);

            expect(result.success).toBe(true);
            expect(result.data.user.role).toBe(UserRole.LIBRARIAN);
        });
    });

    describe('update', () => {
        it('should update user successfully', async () => {
            const updateUserDto = {
                firstName: 'Updated',
                lastName: 'Name',
            };

            const mockUser = {
                id: '1',
                email: 'user@example.com',
                role: UserRole.USER,
            };

            const mockUpdatedUser = {
                id: '1',
                email: 'user@example.com',
                firstName: 'Updated',
                lastName: 'Name',
                phone: null,
                dateOfBirth: null,
                profileImageUrl: null,
                membershipType: MembershipType.FREE,
                updatedAt: new Date(),
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

            const result = await service.update('1', updateUserDto, '1', UserRole.USER);

            expect(result.success).toBe(true);
            expect(result.message).toBe('User updated successfully');
            expect(result.data.user).toEqual(mockUpdatedUser);
        });

        it('should throw NotFoundException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(
                service.update('999', {}, '1', UserRole.USER),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if non-admin tries to update other user', async () => {
            const mockUser = {
                id: '2',
                email: 'other@example.com',
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            await expect(
                service.update('2', {}, '1', UserRole.USER),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should allow admin to update any user', async () => {
            const mockUser = {
                id: '2',
                email: 'other@example.com',
            };

            const mockUpdatedUser = {
                id: '2',
                email: 'other@example.com',
                firstName: 'Updated',
                lastName: 'User',
                phone: null,
                dateOfBirth: null,
                profileImageUrl: null,
                membershipType: MembershipType.FREE,
                updatedAt: new Date(),
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

            const result = await service.update(
                '2',
                { firstName: 'Updated' },
                '1',
                UserRole.ADMIN,
            );

            expect(result.success).toBe(true);
        });
    });

    describe('remove', () => {
        it('should soft delete user successfully', async () => {
            const mockUser = {
                id: '2',
                email: 'user@example.com',
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.user.update.mockResolvedValue({
                ...mockUser,
                status: UserStatus.INACTIVE,
            });

            const result = await service.remove('2', '1');

            expect(result.success).toBe(true);
            expect(result.message).toBe('User deleted successfully');
            expect(mockPrismaService.user.update).toHaveBeenCalledWith({
                where: { id: '2' },
                data: { status: UserStatus.INACTIVE },
            });
        });

        it('should throw NotFoundException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.remove('999', '1')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ForbiddenException if trying to delete own account', async () => {
            const mockUser = {
                id: '1',
                email: 'user@example.com',
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            await expect(service.remove('1', '1')).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('approveUser', () => {
        it('should approve pending user successfully', async () => {
            const mockUser = {
                id: '1',
                email: 'user@example.com',
                status: UserStatus.PENDING_APPROVAL,
            };

            const mockApprovedUser = {
                id: '1',
                email: 'user@example.com',
                firstName: 'Test',
                lastName: 'User',
                status: UserStatus.ACTIVE,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.user.update.mockResolvedValue(mockApprovedUser);

            const result = await service.approveUser('1');

            expect(result.success).toBe(true);
            expect(result.message).toBe('User approved successfully');
            expect(result.data.user.status).toBe(UserStatus.ACTIVE);
        });

        it('should throw NotFoundException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.approveUser('999')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw BadRequestException if user is not pending approval', async () => {
            const mockUser = {
                id: '1',
                email: 'user@example.com',
                status: UserStatus.ACTIVE,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            await expect(service.approveUser('1')).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('suspendUser', () => {
        it('should suspend user successfully', async () => {
            const mockUser = {
                id: '1',
                email: 'user@example.com',
                status: UserStatus.ACTIVE,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.user.update.mockResolvedValue({
                ...mockUser,
                status: UserStatus.SUSPENDED,
            });

            const result = await service.suspendUser('1', 'Violation of terms');

            expect(result.success).toBe(true);
            expect(result.message).toBe('User suspended successfully');
        });

        it('should throw NotFoundException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.suspendUser('999')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw BadRequestException if user is already suspended', async () => {
            const mockUser = {
                id: '1',
                email: 'user@example.com',
                status: UserStatus.SUSPENDED,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            await expect(service.suspendUser('1')).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('activateUser', () => {
        it('should activate user successfully', async () => {
            const mockUser = {
                id: '1',
                email: 'user@example.com',
                status: UserStatus.SUSPENDED,
            };

            const mockActivatedUser = {
                id: '1',
                email: 'user@example.com',
                firstName: 'Test',
                lastName: 'User',
                status: UserStatus.ACTIVE,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.user.update.mockResolvedValue(mockActivatedUser);

            const result = await service.activateUser('1');

            expect(result.success).toBe(true);
            expect(result.message).toBe('User activated successfully');
            expect(result.data.user.status).toBe(UserStatus.ACTIVE);
        });

        it('should throw NotFoundException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.activateUser('999')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw BadRequestException if user is already active', async () => {
            const mockUser = {
                id: '1',
                email: 'user@example.com',
                status: UserStatus.ACTIVE,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            await expect(service.activateUser('1')).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('getUserStats', () => {
        it('should calculate user statistics correctly', async () => {
            mockPrismaService.transaction.count
                .mockResolvedValueOnce(10) // totalBorrowed
                .mockResolvedValueOnce(2) // currentlyBorrowed
                .mockResolvedValueOnce(1); // overdueBooks

            mockPrismaService.payment.aggregate.mockResolvedValue({
                _sum: { lateFee: 150 },
            });

            const stats = await service.getUserStats('1');

            expect(stats).toEqual({
                totalBorrowed: 10,
                currentlyBorrowed: 2,
                overdueBooks: 1,
                totalFinesPaid: 150,
            });
        });

        it('should handle zero fines', async () => {
            mockPrismaService.transaction.count
                .mockResolvedValueOnce(0)
                .mockResolvedValueOnce(0)
                .mockResolvedValueOnce(0);

            mockPrismaService.payment.aggregate.mockResolvedValue({
                _sum: { lateFee: null },
            });

            const stats = await service.getUserStats('1');

            expect(stats.totalFinesPaid).toBe(0);
        });
    });
});
