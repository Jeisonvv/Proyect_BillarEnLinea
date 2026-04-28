import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../models/enums.js';
import { UploadImageDto } from './dto/uploads.dto.js';
import { UploadsNestService } from './uploads.service.js';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

@Controller('api/uploads')
export class UploadsNestController {
  constructor(private readonly uploadsService: UploadsNestService) {}

  @Post('images')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  }))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UploadImageDto,
  ) {
    if (!file) {
      throw new HttpException({ ok: false, message: 'Debes adjuntar un archivo en el campo file.' }, HttpStatus.BAD_REQUEST);
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new HttpException({ ok: false, message: 'Tipo de archivo no permitido. Usa JPG, PNG, WEBP, GIF o AVIF.' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.uploadsService.uploadImage(file, body);
      return { ok: true, data: result };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message ?? 'No fue posible subir la imagen.' }, HttpStatus.BAD_REQUEST);
    }
  }
}