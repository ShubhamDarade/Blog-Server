const fs = require("fs");
const path = require("path");
const winston = require("winston");

const logDir = path.join(__dirname, "../logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const customFormat = winston.format.printf(
  ({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}${
      stack ? `\nStack: ${stack}` : ""
    }`;
  }
);

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), customFormat),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 5242880, // 5MB per file
      maxFiles: 5, // Keep a maximum of 5 log files
    }),

    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5242880,
      maxFiles: 5,
    }),

    new winston.transports.Console(),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, "exceptions.log"),
      maxsize: 5242880,
      maxFiles: 5,
    }),

    new winston.transports.Console(),
  ],
  exitOnError: true,
});

module.exports = logger;
