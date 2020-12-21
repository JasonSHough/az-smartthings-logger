const logger = require('../logging');

const fs = require('fs');
const os = require('os');

logger.defaultMeta = { service: 'q2jsonl' };

const run = (context, req) => {
    logger.info(`Invoked on ${os.hostname()}`);
    logger.debug(`input is ${JSON.stringify(req)}`);

    // convert and validate input data
    req = convertReqToObject(req);

    // validate the input matches our schema
    validateReqSchema(req);

    // determine the filename to append this event to, based on timestamp
    var fname = generateFileName(req);

    // store the data as jsonlines
    logger.info(`Appending to ${fname}`);
    saveData(req, fname);

    // end the function
    logger.info('Complete.');
    context.done();
};

// accept either object of JSON string which can be converted to object
const convertReqToObject = (req) => {
    if (typeof req === 'object') {
        logger.debug('Object received.');
    } else {
        req = JSON.parse(req);
        logger.debug('JSON string parsed successfully.');
    }
    return req;
};

// validate the object 1) has the keys we expect and 2) has a proper date
const validateReqSchema = (req) => {
    const props = [
        'date',
        'hub',
        'deviceId',
        'deviceType',
        'eventId',
        'device',
        'property',
        'value',
        'unit',
        'isphysical',
        'isstatechange',
        'source',
        'location',
    ];
    if (
        !props.every((item) => item in req) ||
        !req.date.match(/\d{4}-\d{2}-\d{2}T/)
    ) {
        throw new Error('Object does not match expected schema.');
    }
};

const generateFileName = (req) => {
    return req.date.substring(0, 10) + '.jsonl';
};

const saveData = (req, fname, path = '/data/events') => {
    fs.mkdirSync(path, { recursive: true });

    var data = `${JSON.stringify(req)}\n`;
    fs.appendFileSync(`${path}/${fname}`, data, 'utf8');
};

module.exports = {
    run,
    convertReqToObject,
    validateReqSchema,
    generateFileName,
    saveData,
};
