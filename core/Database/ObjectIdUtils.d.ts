import mongoose from 'mongoose';
/**
 * True for a 24-character hex string that round-trips as an ObjectId (stricter than `isValid` alone).
 */
export declare function isMongoObjectId(value: string): boolean;
export declare function mongoObjectId(value: string): mongoose.Types.ObjectId;
//# sourceMappingURL=ObjectIdUtils.d.ts.map