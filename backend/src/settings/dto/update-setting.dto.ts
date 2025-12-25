import { IsNotEmpty, IsString, IsNumber, IsBoolean, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSettingDto {
    @IsNotEmpty()
    value: string | number | boolean | object;

    // Validation helpers for type checking
    @ValidateIf((o) => typeof o.value === 'string')
    @IsString()
    get stringValue() {
        return typeof this.value === 'string' ? this.value : undefined;
    }

    @ValidateIf((o) => typeof o.value === 'number')
    @IsNumber()
    @Type(() => Number)
    get numberValue() {
        return typeof this.value === 'number' ? this.value : undefined;
    }

    @ValidateIf((o) => typeof o.value === 'boolean')
    @IsBoolean()
    get booleanValue() {
        return typeof this.value === 'boolean' ? this.value : undefined;
    }
}
