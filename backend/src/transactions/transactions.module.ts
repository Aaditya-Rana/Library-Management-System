import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PrismaService } from '../common/services/prisma.service';
import { BooksModule } from '../books/books.module';

@Module({
    imports: [BooksModule],
    controllers: [TransactionsController],
    providers: [TransactionsService, PrismaService],
    exports: [TransactionsService],
})
export class TransactionsModule { }
