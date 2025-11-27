import winston from "winston";
import path from "path";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

// Tell winston about our colors
winston.addColors(colors);

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define which transports the logger must use
const transports = [
  // Console transport with JSON format (like Pino)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
      winston.format.errors({ stack: true }),
      winston.format.printf((info) => {
        const { timestamp, level, message, stack, ...meta } = info;
        const logObject: Record<string, unknown> = {
          level: level.replace(/\u001b\[\d+m/g, ""), // Remove color codes
          time: timestamp,
          msg: message,
          ...meta,
        };
        if (stack) {
          logObject.stack = stack;
        }
        return JSON.stringify(logObject);
      })
    ),
  }),

  // Error log file
  new winston.transports.File({
    filename: path.join(process.cwd(), "logs", "error.log"),
    level: "error",
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Combined log file
  new winston.transports.File({
    filename: path.join(process.cwd(), "logs", "combined.log"),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  levels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "exceptions.log"),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "rejections.log"),
    }),
  ],
});

export default logger;
