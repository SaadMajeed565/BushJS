"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = exports.Connection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
class Connection {
    constructor(connectionString = 'mongodb://localhost:27017/bushjs') {
        this.connected = false;
        this.connectionString = connectionString;
    }
    async connect() {
        if (this.connected) {
            return;
        }
        try {
            await mongoose_1.default.connect(this.connectionString);
            this.connected = true;
            console.log('Connected to MongoDB');
        }
        catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }
    async disconnect() {
        if (this.connected) {
            await mongoose_1.default.disconnect();
            this.connected = false;
        }
    }
    getConnection() {
        return mongoose_1.default;
    }
    isConnected() {
        return this.connected;
    }
}
exports.Connection = Connection;
exports.connection = new Connection();
//# sourceMappingURL=Connection.js.map