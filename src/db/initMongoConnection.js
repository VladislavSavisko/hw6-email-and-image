import mongoose from 'mongoose';

export const initMongoConnection = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(' Successfully connected to MongoDB');
  } catch (error) {
    console.error(' Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};
