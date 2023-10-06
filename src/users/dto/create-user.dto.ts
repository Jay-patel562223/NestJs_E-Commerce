import { IsNotEmpty, IsString, IsIn, IsOptional, IsEnum } from "class-validator";
import { userTypes } from "src/shared/schema/users";

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsString()
    email: string

    @IsNotEmpty()
    @IsString()
    password: string

    @IsNotEmpty()
    @IsString()
    @IsEnum(userTypes)
    type: string

    @IsString()
    @IsOptional()
    secretToken?: string

    isVerified?: boolean
}
