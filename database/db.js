const mongoose = require("mongoose");

exports.connectDB = async () => {
  const dbURI = process.env.MONGO_URI;

  try {
    await mongoose.connect(dbURI);
    console.log(`MongoDB connected`);
  } catch (error) {
    console.error(`Error in Database Connection: ${error.message}`);
    throw error;
  }
};
