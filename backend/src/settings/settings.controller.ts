import { Controller, Get, Patch, Post, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { QuerySettingsDto } from './dto/query-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async getAllSettings(@Query() queryDto: QuerySettingsDto) {
        return this.settingsService.getAllSettings(queryDto.category);
    }

    @Get(':key')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @HttpCode(HttpStatus.OK)
    async getSetting(@Param('key') key: string) {
        return this.settingsService.getSetting(key);
    }

    @Patch(':key')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async updateSetting(
        @Param('key') key: string,
        @Body() updateDto: UpdateSettingDto,
    ) {
        return this.settingsService.updateSetting(key, updateDto);
    }

    @Post(':key/reset')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async resetToDefault(@Param('key') key: string) {
        return this.settingsService.resetToDefault(key);
    }
}
