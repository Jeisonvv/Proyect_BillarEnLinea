import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { IdentityDocumentType, PlayerCategory } from '../../../models/enums.js';

const INTERNATIONAL_PHONE_REGEX = /^[1-9]\d{9,14}$/;
const PHONE_FORMAT_ERROR = 'Formato incorrecto. Usa codigo de pais + numero (10 a 15 digitos), sin espacios ni guiones.';

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
  @Matches(INTERNATIONAL_PHONE_REGEX, { message: PHONE_FORMAT_ERROR })
  phone!: string;

  @IsString()
  @IsNotEmpty()
  identityDocument!: string;

  @IsEnum(IdentityDocumentType)
  identityDocumentType!: IdentityDocumentType;

  @IsEnum(PlayerCategory)
  playerCategory!: PlayerCategory;

  @IsString()
  @IsNotEmpty()
  ciudad!: string;

  @IsString()
  direccion?: string;
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

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  @Matches(INTERNATIONAL_PHONE_REGEX, { message: PHONE_FORMAT_ERROR })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  ciudad?: string;

  @IsOptional()
  @IsString()
  direccion?: string;
}