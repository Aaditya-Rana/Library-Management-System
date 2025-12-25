import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PrismaService } from '../common/services/prisma.service';
import { BooksModule } from '../books/books.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [BooksModule, NotificationsModule],
    controllers: [TransactionsController],
    providers: [TransactionsService, PrismaService],
    exports: [TransactionsService],
})
export class TransactionsModule { }
