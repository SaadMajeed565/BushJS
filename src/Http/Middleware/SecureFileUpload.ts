import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { logger } from '../../Foundation/ExceptionHandler';
import { Storage } from '../../Storage/Storage';

export interface FileUploadOptions {
  destination?: string;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  maxFiles?: number;
  preserveFilename?: boolean;
}

function resolveUploadDestination(destination?: string): string {
  if (destination === undefined || destination === '') {
    return Storage.resolvedPath('uploads');
  }
  if (path.isAbsolute(destination)) {
    return destination;
  }
  const d = destination.replace(/^\.\/?/, '');
  if (d === 'storage' || d.startsWith('storage/')) {
    const rest = d === 'storage' ? '' : d.slice('storage/'.length);
    const parts = rest.split('/').filter(Boolean);
    return parts.length ? Storage.resolvedPath(...parts) : Storage.resolvedPath();
  }
  return path.resolve(process.cwd(), destination);
}

export class SecureFileUpload {
  private multerInstance: multer.Multer | null = null;
  private readonly options: {
    destination?: string;
    maxFileSize: number;
    allowedTypes: string[];
    maxFiles: number;
    preserveFilename: boolean;
  };

  constructor(options: FileUploadOptions = {}) {
    this.options = {
      destination: options.destination,
      maxFileSize: options.maxFileSize ?? 5 * 1024 * 1024, // 5MB default
      allowedTypes: options.allowedTypes ?? ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      maxFiles: options.maxFiles ?? 10,
      preserveFilename: options.preserveFilename ?? false
    };
  }

  private getMulter(): multer.Multer {
    if (this.multerInstance) {
      return this.multerInstance;
    }

    const destination = resolveUploadDestination(this.options.destination);

    const diskStorage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, destination);
      },
      filename: (req, file, cb) => {
        if (this.options.preserveFilename) {
          const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          cb(null, `${Date.now()}-${sanitized}`);
        } else {
          const ext = path.extname(file.originalname);
          cb(null, `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`);
        }
      }
    });

    const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (!this.options.allowedTypes.includes(file.mimetype)) {
        logger.warning('File upload rejected: invalid file type', {
          filename: file.originalname,
          mimetype: file.mimetype,
          allowedTypes: this.options.allowedTypes
        });
        return cb(
          new Error(
            `File type ${file.mimetype} not allowed. Allowed types: ${this.options.allowedTypes.join(', ')}`
          )
        );
      }

      const ext = path.extname(file.originalname).toLowerCase();
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar'];
      if (dangerousExtensions.includes(ext)) {
        logger.warning('File upload rejected: dangerous file extension', {
          filename: file.originalname,
          extension: ext
        });
        return cb(new Error('Dangerous file extension not allowed'));
      }

      cb(null, true);
    };

    this.multerInstance = multer({
      storage: diskStorage,
      fileFilter,
      limits: {
        fileSize: this.options.maxFileSize,
        files: this.options.maxFiles
      }
    });

    return this.multerInstance;
  }

  single(fieldName: string) {
    return this.getMulter().single(fieldName);
  }

  array(fieldName: string, maxCount?: number) {
    return this.getMulter().array(fieldName, maxCount);
  }

  fields(fields: { name: string; maxCount?: number }[]) {
    return this.getMulter().fields(fields);
  }

  any() {
    return this.getMulter().any();
  }
}

export const imageUpload = new SecureFileUpload({
  maxFileSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxFiles: 5
});

export const documentUpload = new SecureFileUpload({
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  maxFiles: 3
});

export const avatarUpload = new SecureFileUpload({
  destination: './storage/avatars',
  maxFileSize: 1 * 1024 * 1024, // 1MB
  allowedTypes: ['image/jpeg', 'image/png'],
  maxFiles: 1,
  preserveFilename: false
});

export function cleanupUploadedFiles(files: Express.Multer.File[]): void {
  const fs = require('fs');

  files.forEach((file) => {
    try {
      fs.unlinkSync(path.join(file.destination, file.filename));
      logger.info('Cleaned up uploaded file', { filename: file.filename });
    } catch (error) {
      logger.error('Failed to cleanup uploaded file', {
        filename: file.filename,
        error: (error as Error).message
      });
    }
  });
}
