import mongoose from 'mongoose';

export type QueryCondition = {
  column: string;
  operator: string;
  value: any;
};

export class Connection {
  private connectionString: string;
  private connected = false;

  constructor(connectionString = 'mongodb://localhost:27017/bushjs') {
    this.connectionString = connectionString;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      await mongoose.connect(this.connectionString);
      this.connected = true;
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await mongoose.disconnect();
      this.connected = false;
    }
  }

  getConnection(): typeof mongoose {
    return mongoose;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const connection = new Connection();
