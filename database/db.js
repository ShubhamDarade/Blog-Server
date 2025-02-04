const mongoose = require("mongoose");
const logger = require("../config/logger");

exports.connectDB = async () => {
  const dbURI = process.env.MONGO_URI;
  logger.info(`[DB CONNECTION] Attempting to connect to MongoDB`);

  try {
    await mongoose.connect(dbURI);
    logger.info(`[DB CONNECTION] MongoDB connected successfully`);
  } catch (error) {
    logger.error(
      `[DB CONNECTION] Error in Database Connection: ${error.message}`
    );
    throw error;
  }
};
