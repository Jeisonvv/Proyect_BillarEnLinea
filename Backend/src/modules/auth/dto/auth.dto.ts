import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { IdentityDocumentType, PlayerCategory } from '../../../models/enums.js';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  identityDocument!: string;

  @IsEnum(IdentityDocumentType)
  identityDocumentType!: IdentityDocumentType;

  @IsEnum(PlayerCategory)
  playerCategory!: PlayerCategory;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}