import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus, MembershipType } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll(queryDto: QueryUsersDto) {
        const {
            page = 1,
            limit = 20,
            role,
            status,
            membershipType,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = queryDto;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: {
            role?: UserRole;
            status?: UserStatus;
            membershipType?: MembershipType;
            OR?: Array<{
                firstName?: { contains: string; mode: 'insensitive' };
                lastName?: { contains: string; mode: 'insensitive' };
                email?: { contains: string; mode: 'insensitive' };
            }>;
        } = {};

        if (role) {
            where.role = role;
        }

        if (status) {
            where.status = status;
        }

        if (membershipType) {
            where.membershipType = membershipType;
        }

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Get total count
        const total = await this.prisma.user.count({ where });

        // Get users
        const users = await this.prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                status: true,
                membershipType: true,
                membershipExpiry: true,
                profileImageUrl: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });

        return {
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        };
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                dateOfBirth: true,
                role: true,
                status: true,
                membershipType: true,
                membershipExpiry: true,
                profileImageUrl: true,
                emailVerified: true,
                twoFactorEnabled: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Get user statistics
        const stats = await this.getUserStats(id);

        return {
            success: true,
            data: {
                user: {
                    ...user,
                    stats,
                },
            },
        };
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async create(createUserDto: CreateUserDto, creatorRole: UserRole) {
        // Check if email already exists
        const existingUser = await this.findByEmail(createUserDto.email);
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Role-based restrictions for creating users
        const requestedRole = createUserDto.role || UserRole.USER;

        // ADMIN can only create LIBRARIAN and USER roles
        // SUPER_ADMIN can create any role
        if (creatorRole === UserRole.ADMIN) {
            if (
                requestedRole === UserRole.SUPER_ADMIN ||
                requestedRole === UserRole.ADMIN
            ) {
                throw new ForbiddenException(
                    'Admins cannot create SUPER_ADMIN or ADMIN users. Only SUPER_ADMIN can create these roles.',
                );
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        // Create user with ACTIVE status (admin-created users are pre-approved)
        const user = await this.prisma.user.create({
            data: {
                email: createUserDto.email,
                password: hashedPassword,
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                phone: createUserDto.phone,
                dateOfBirth: createUserDto.dateOfBirth
                    ? new Date(createUserDto.dateOfBirth)
                    : undefined,
                role: requestedRole,
                membershipType: createUserDto.membershipType,
                status: UserStatus.ACTIVE, // Admin-created users are pre-approved
                emailVerified: true, // Admin-created users are pre-verified
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                membershipType: true,
                createdAt: true,
            },
        });

        return {
            success: true,
            message: 'User created successfully',
            data: { user },
        };
    }

    async update(
        id: string,
        updateUserDto: UpdateUserDto,
        requestingUserId: string,
        requestingUserRole: UserRole,
    ) {
        // Check if user exists
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check authorization: super admin and admin can update anyone, users can only update themselves
        if (
            requestingUserRole !== UserRole.SUPER_ADMIN &&
            requestingUserRole !== UserRole.ADMIN &&
            id !== requestingUserId
        ) {
            throw new ForbiddenException('Cannot update other users');
        }

        // Update user
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: {
                firstName: updateUserDto.firstName,
                lastName: updateUserDto.lastName,
                phone: updateUserDto.phone,
                dateOfBirth: updateUserDto.dateOfBirth
                    ? new Date(updateUserDto.dateOfBirth)
                    : undefined,
                profileImageUrl: updateUserDto.profileImageUrl,
                membershipType: updateUserDto.membershipType,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                dateOfBirth: true,
                profileImageUrl: true,
                membershipType: true,
                updatedAt: true,
            },
        });

        return {
            success: true,
            message: 'User updated successfully',
            data: { user: updatedUser },
        };
    }

    async remove(id: string, requestingUserId: string, requestingUserRole: UserRole) {
        // Check if user exists
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Prevent deleting own account
        if (id === requestingUserId) {
            throw new ForbiddenException('Cannot delete your own account');
        }

        // Role-based restrictions: ADMIN cannot delete SUPER_ADMIN or other ADMINs
        if (requestingUserRole === UserRole.ADMIN) {
            if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
                throw new ForbiddenException(
                    'Admins cannot delete SUPER_ADMIN or ADMIN users. Only SUPER_ADMIN can delete these roles.',
                );
            }
        }

        // Soft delete by setting status to INACTIVE
        await this.prisma.user.update({
            where: { id },
            data: { status: UserStatus.INACTIVE },
        });

        return {
            success: true,
            message: 'User deleted successfully',
        };
    }

    async approveUser(id: string, requestingUserRole: UserRole) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.status !== UserStatus.PENDING_APPROVAL) {
            throw new BadRequestException(
                'User is not pending approval',
            );
        }

        // Role-based restrictions: ADMIN cannot approve SUPER_ADMIN or ADMIN users
        if (requestingUserRole === UserRole.ADMIN) {
            if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
                throw new ForbiddenException(
                    'Admins cannot approve SUPER_ADMIN or ADMIN users. Only SUPER_ADMIN can approve these roles.',
                );
            }
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: { status: UserStatus.ACTIVE },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
            },
        });

        // TODO: Send approval email notification

        return {
            success: true,
            message: 'User approved successfully',
            data: { user: updatedUser },
        };
    }

    async suspendUser(id: string, requestingUserRole: UserRole, _reason?: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.status === UserStatus.SUSPENDED) {
            throw new BadRequestException('User is already suspended');
        }

        // Role-based restrictions: ADMIN cannot suspend SUPER_ADMIN or other ADMINs
        if (requestingUserRole === UserRole.ADMIN) {
            if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
                throw new ForbiddenException(
                    'Admins cannot suspend SUPER_ADMIN or ADMIN users. Only SUPER_ADMIN can suspend these roles.',
                );
            }
        }

        await this.prisma.user.update({
            where: { id },
            data: { status: UserStatus.SUSPENDED },
        });

        // TODO: Log suspension reason in audit logs
        // TODO: Send suspension email notification

        return {
            success: true,
            message: 'User suspended successfully',
        };
    }

    async activateUser(id: string, requestingUserRole: UserRole) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.status === UserStatus.ACTIVE) {
            throw new BadRequestException('User is already active');
        }

        // Role-based restrictions: ADMIN cannot activate SUPER_ADMIN or ADMIN users
        if (requestingUserRole === UserRole.ADMIN) {
            if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
                throw new ForbiddenException(
                    'Admins cannot activate SUPER_ADMIN or ADMIN users. Only SUPER_ADMIN can activate these roles.',
                );
            }
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: { status: UserStatus.ACTIVE },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
            },
        });

        // TODO: Send activation email notification

        return {
            success: true,
            message: 'User activated successfully',
            data: { user: updatedUser },
        };
    }

    async getUserStats(userId: string) {
        // Get transaction statistics
        const [totalBorrowed, currentlyBorrowed, overdueBooks, payments] =
            await Promise.all([
                // Total books ever borrowed
                this.prisma.transaction.count({
                    where: { userId },
                }),
                // Currently borrowed books
                this.prisma.transaction.count({
                    where: {
                        userId,
                        status: 'ISSUED',
                    },
                }),
                // Overdue books
                this.prisma.transaction.count({
                    where: {
                        userId,
                        status: 'OVERDUE',
                    },
                }),
                // Total fines paid
                this.prisma.payment.aggregate({
                    where: {
                        userId,
                        paymentStatus: 'COMPLETED',
                    },
                    _sum: {
                        lateFee: true,
                    },
                }),
            ]);

        return {
            success: true,
            data: {
                totalBorrowed,
                currentlyBorrowed,
                overdueBooks,
                totalFinesPaid: payments._sum.lateFee || 0,
                unpaidFines: 0, // TODO: Calculate from current overdue transactions
            },
        };
    }
}
