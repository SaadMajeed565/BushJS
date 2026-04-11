export interface FileUploadOptions {
    destination?: string;
    maxFileSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
    preserveFilename?: boolean;
}
export declare class SecureFileUpload {
    private multerInstance;
    private readonly options;
    constructor(options?: FileUploadOptions);
    private getMulter;
    single(fieldName: string): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    array(fieldName: string, maxCount?: number): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    fields(fields: {
        name: string;
        maxCount?: number;
    }[]): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    any(): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
}
export declare const imageUpload: SecureFileUpload;
export declare const documentUpload: SecureFileUpload;
export declare const avatarUpload: SecureFileUpload;
export declare function cleanupUploadedFiles(files: Express.Multer.File[]): void;
//# sourceMappingURL=SecureFileUpload.d.ts.map