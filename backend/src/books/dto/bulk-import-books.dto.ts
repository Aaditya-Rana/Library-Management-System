import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBookDto } from './create-book.dto';

export class BulkImportBooksDto {
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1, { message: 'At least one book is required for bulk import' })
    @Type(() => CreateBookDto)
    books: CreateBookDto[];
}
