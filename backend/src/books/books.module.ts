import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { PrismaService } from '../common/services/prisma.service';
import { CloudinaryService } from '../common/services/cloudinary.service';

@Module({
    controllers: [BooksController],
    providers: [BooksService, PrismaService, CloudinaryService],
    exports: [BooksService],
})
export class BooksModule { }
