import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = new MongoMemoryServer();

export const dbConnect = async (): Promise<mongoose.Connection> => {
  const uri = await mongod.getUri();
  const mongooseOpts = {
    useNewUrlParser: true,
    // autoReconnect: true,
    // reconnectTries: Number.MAX_VALUE,
    // reconnectInterval: 1000,
    poolSize: 10,
    useUnifiedTopology: true,
  };
  return mongoose.createConnection(uri, mongooseOpts);
};

export const dbClose = async (): Promise<void> => {
  // await mongoose.connection.dropDatabase();
  // await mongoose.connection.close();
  await mongoose.disconnect();
  await mongod.stop();
};

export const dbClear = async (): Promise<void> => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
