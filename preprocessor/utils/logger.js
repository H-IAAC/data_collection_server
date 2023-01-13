const winston = require('winston');

var logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf((info) => {
        return JSON.stringify({
            TIMESTAMP: info.timestamp,
            LEVEL: info.level,
            LOG: info.message
        });
    }));

const logger = winston.createLogger({
    format: logFormat,
    transports: [
        new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: './logs/info.log', level: 'info' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: logFormat
    }));
}

module.exports = logger;