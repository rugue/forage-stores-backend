import { Injectable } from '@nestjs/common';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FileUploadService {
  private readonly uploadsPath = path.join(process.cwd(), 'uploads');
  private readonly profilesPath = path.join(this.uploadsPath, 'profiles');

  constructor() {
    this.ensureUploadDirectories();
  }

  private ensureUploadDirectories() {
    if (!fs.existsSync(this.uploadsPath)) {
      fs.mkdirSync(this.uploadsPath, { recursive: true });
    }
    if (!fs.existsSync(this.profilesPath)) {
      fs.mkdirSync(this.profilesPath, { recursive: true });
    }
  }

  getMulterOptions() {
    return {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req: any, file: any, cb: any) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'), false);
        }
      },
    };
  }

  getProfilesPath(): string {
    return this.profilesPath;
  }

  generateFileName(userId: string, originalName: string): string {
    const fileExtension = path.extname(originalName);
    return `${userId}-${Date.now()}${fileExtension}`;
  }
}
