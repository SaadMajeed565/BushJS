import mongoose from 'mongoose';

/**
 * True for a 24-character hex string that round-trips as an ObjectId (stricter than `isValid` alone).
 */
export function isMongoObjectId(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  return mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === value;
}

export function mongoObjectId(value: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(value);
}
