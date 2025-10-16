const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, colorize } = format;

const logFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  format: combine(
    label({ label: 'SFC-MES' }),
    timestamp(),
    colorize(),
    logFormat
  ),
  transports: [
    new transports.Console(),  // Output logs to the console
    new transports.File({ filename: 'app.log' })  // Optionally log to a file
  ]
});

module.exports = logger;
