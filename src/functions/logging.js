const logger = require('winston');
const format = require('winston').format;

var logformat = format.combine(
    format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

const isRunningOnAzureFunction = () => {
    return process.env.AzureWebJobsStorage;
};

if (isRunningOnAzureFunction()) {
    logger.add(
        new logger.transports.File({
            filename: '/data/error.log',
            level: 'error',
            handleExceptions: true,
            format: logformat,
        })
    );
} else {
    logger.add(
        new logger.transports.Console({
            level: 'debug',
            handleExceptions: true,
            format: logformat,
        })
    );
}

module.exports = logger;
