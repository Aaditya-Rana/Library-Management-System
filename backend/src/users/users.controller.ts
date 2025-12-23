import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() createUserDto: CreateUserDto,
        @GetUser('role') creatorRole: UserRole,
    ) {
        return this.usersService.create(createUserDto, creatorRole);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async findAll(@Query() queryDto: QueryUsersDto) {
        return this.usersService.findAll(queryDto);
    }

    @Get('me')
    @HttpCode(HttpStatus.OK)
    async getCurrentUser(@GetUser('id') userId: string) {
        return this.usersService.findOne(userId);
    }

    @Patch('me')
    @HttpCode(HttpStatus.OK)
    async updateCurrentUser(
        @GetUser('id') userId: string,
        @GetUser('role') role: UserRole,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.usersService.update(userId, updateUserDto, userId, role);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(
        @Param('id') id: string,
        @GetUser('id') requestingUserId: string,
        @GetUser('role') role: UserRole,
    ) {
        // Super Admin, Admin and Librarian can view any user, regular users can only view themselves
        if (
            role !== UserRole.SUPER_ADMIN &&
            role !== UserRole.ADMIN &&
            role !== UserRole.LIBRARIAN &&
            id !== requestingUserId
        ) {
            // For non-admin/librarian users, only allow viewing own profile
            return this.usersService.findOne(requestingUserId);
        }
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
        @GetUser('id') requestingUserId: string,
        @GetUser('role') role: UserRole,
    ) {
        return this.usersService.update(id, updateUserDto, requestingUserId, role);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async remove(
        @Param('id') id: string,
        @GetUser('id') requestingUserId: string,
        @GetUser('role') requestingUserRole: UserRole,
    ) {
        return this.usersService.remove(id, requestingUserId, requestingUserRole);
    }

    @Post(':id/approve')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async approve(
        @Param('id') id: string,
        @GetUser('role') requestingUserRole: UserRole,
    ) {
        return this.usersService.approveUser(id, requestingUserRole);
    }

    @Post(':id/suspend')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async suspend(
        @Param('id') id: string,
        @GetUser('role') requestingUserRole: UserRole,
        @Body() suspendUserDto: SuspendUserDto,
    ) {
        return this.usersService.suspendUser(id, requestingUserRole, suspendUserDto.reason);
    }

    @Post(':id/activate')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async activate(
        @Param('id') id: string,
        @GetUser('role') requestingUserRole: UserRole,
    ) {
        return this.usersService.activateUser(id, requestingUserRole);
    }
}
