"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarUpload = exports.documentUpload = exports.imageUpload = exports.SecureFileUpload = void 0;
exports.cleanupUploadedFiles = cleanupUploadedFiles;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const ExceptionHandler_1 = require("../../Foundation/ExceptionHandler");
const Storage_1 = require("../../Storage/Storage");
function resolveUploadDestination(destination) {
    if (destination === undefined || destination === '') {
        return Storage_1.Storage.resolvedPath('uploads');
    }
    if (path_1.default.isAbsolute(destination)) {
        return destination;
    }
    const d = destination.replace(/^\.\/?/, '');
    if (d === 'storage' || d.startsWith('storage/')) {
        const rest = d === 'storage' ? '' : d.slice('storage/'.length);
        const parts = rest.split('/').filter(Boolean);
        return parts.length ? Storage_1.Storage.resolvedPath(...parts) : Storage_1.Storage.resolvedPath();
    }
    return path_1.default.resolve(process.cwd(), destination);
}
class SecureFileUpload {
    constructor(options = {}) {
        this.multerInstance = null;
        this.options = {
            destination: options.destination,
            maxFileSize: options.maxFileSize ?? 5 * 1024 * 1024, // 5MB default
            allowedTypes: options.allowedTypes ?? ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
            maxFiles: options.maxFiles ?? 10,
            preserveFilename: options.preserveFilename ?? false
        };
    }
    getMulter() {
        if (this.multerInstance) {
            return this.multerInstance;
        }
        const destination = resolveUploadDestination(this.options.destination);
        const diskStorage = multer_1.default.diskStorage({
            destination: (req, file, cb) => {
                cb(null, destination);
            },
            filename: (req, file, cb) => {
                if (this.options.preserveFilename) {
                    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
                    cb(null, `${Date.now()}-${sanitized}`);
                }
                else {
                    const ext = path_1.default.extname(file.originalname);
                    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`);
                }
            }
        });
        const fileFilter = (req, file, cb) => {
            if (!this.options.allowedTypes.includes(file.mimetype)) {
                ExceptionHandler_1.logger.warning('File upload rejected: invalid file type', {
                    filename: file.originalname,
                    mimetype: file.mimetype,
                    allowedTypes: this.options.allowedTypes
                });
                return cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${this.options.allowedTypes.join(', ')}`));
            }
            const ext = path_1.default.extname(file.originalname).toLowerCase();
            const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar'];
            if (dangerousExtensions.includes(ext)) {
                ExceptionHandler_1.logger.warning('File upload rejected: dangerous file extension', {
                    filename: file.originalname,
                    extension: ext
                });
                return cb(new Error('Dangerous file extension not allowed'));
            }
            cb(null, true);
        };
        this.multerInstance = (0, multer_1.default)({
            storage: diskStorage,
            fileFilter,
            limits: {
                fileSize: this.options.maxFileSize,
                files: this.options.maxFiles
            }
        });
        return this.multerInstance;
    }
    single(fieldName) {
        return this.getMulter().single(fieldName);
    }
    array(fieldName, maxCount) {
        return this.getMulter().array(fieldName, maxCount);
    }
    fields(fields) {
        return this.getMulter().fields(fields);
    }
    any() {
        return this.getMulter().any();
    }
}
exports.SecureFileUpload = SecureFileUpload;
exports.imageUpload = new SecureFileUpload({
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFiles: 5
});
exports.documentUpload = new SecureFileUpload({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ],
    maxFiles: 3
});
exports.avatarUpload = new SecureFileUpload({
    destination: './storage/avatars',
    maxFileSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: ['image/jpeg', 'image/png'],
    maxFiles: 1,
    preserveFilename: false
});
function cleanupUploadedFiles(files) {
    const fs = require('fs');
    files.forEach((file) => {
        try {
            fs.unlinkSync(path_1.default.join(file.destination, file.filename));
            ExceptionHandler_1.logger.info('Cleaned up uploaded file', { filename: file.filename });
        }
        catch (error) {
            ExceptionHandler_1.logger.error('Failed to cleanup uploaded file', {
                filename: file.filename,
                error: error.message
            });
        }
    });
}
//# sourceMappingURL=SecureFileUpload.js.map