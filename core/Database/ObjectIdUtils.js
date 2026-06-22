"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMongoObjectId = isMongoObjectId;
exports.mongoObjectId = mongoObjectId;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * True for a 24-character hex string that round-trips as an ObjectId (stricter than `isValid` alone).
 */
function isMongoObjectId(value) {
    if (!value || typeof value !== 'string') {
        return false;
    }
    return mongoose_1.default.Types.ObjectId.isValid(value) && String(new mongoose_1.default.Types.ObjectId(value)) === value;
}
function mongoObjectId(value) {
    return new mongoose_1.default.Types.ObjectId(value);
}
//# sourceMappingURL=ObjectIdUtils.js.map