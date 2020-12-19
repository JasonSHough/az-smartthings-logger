module.exports = async function (context, req) {
    const { AppendBlobClient } = require('@azure/storage-blob');

    // convert and validate input data
    context.log(`input is ${JSON.stringify(req)}`);
    req = convertReqToObject(context, req);
    validateReqSchema(req);

    // determine the filename to append this event to, based on timestamp
    var fname = req.date.substring(0, 10) + '.jsonl';
    context.log(`appending to ${fname}`);

    // store the data as jsonlines
    var data = `${JSON.stringify(req)}\n`;
    const blob = new AppendBlobClient(
        process.env.AzureWebJobsStorage,
        'eventlog',
        fname
    );
    await blob.createIfNotExists();
    await blob.appendBlock(data, Buffer.byteLength(data, 'utf8'));

    // end the function
    context.done();
};

// accept either object of JSON string which can be converted to object
const convertReqToObject = (context, req) => {
    if (typeof req === 'object') {
        context.log('Object received.');
    } else {
        req = JSON.parse(req);
        context.log('JSON string parsed successfully.');
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
