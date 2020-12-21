const logger = require('../logging');
const fs = require('fs');
var parquet = require('parquetjs-lite');
var readlines = require('n-readlines');

logger.defaultMeta = { service: 'jsonl2parquet' };

var schema = new parquet.ParquetSchema({
    date: { type: 'UTF8' },
    hub: { type: 'UTF8', optional: true },
    deviceId: { type: 'UTF8', optional: true },
    deviceType: { type: 'UTF8', optional: true },
    eventId: { type: 'UTF8', optional: true },
    device: { type: 'UTF8', optional: true },
    property: { type: 'UTF8', optional: true },
    value: { type: 'UTF8', optional: true },
    unit: { type: 'UTF8', optional: true },
    isphysical: { type: 'BOOLEAN', optional: true },
    isstatechange: { type: 'BOOLEAN', optional: true },
    source: { type: 'UTF8', optional: true },
    location: { type: 'UTF8', optional: true },
});

// run is the default entrypoint for Azure Functions
const run = async function (context, req) {
    logger.info(`Starting file conversions..`);

    const files = filesToProcess();
    logger.info(`Found ${files.length} files to process.`);

    for (const file of files) {
        logger.info(`Converting ${file}`);
        await convertFile(file);
    }

    // end the function
    context.done();
};

// file operations to read .jsonl and write .parquet
const convertFile = async (inputFile) => {
    var outputFile = inputFile.replace('.jsonl', '.parquet');
    var writer = await parquet.ParquetWriter.openFile(schema, outputFile);

    var liner = new readlines(inputFile);
    var row = 1;
    while ((next = liner.next())) {
        logger.debug(`Appending row ${row++} to ${outputFile}`);
        var data = JSON.parse(next.toString());
        await writer.appendRow(data);
    }
    await writer.close();
    logger.debug(`done ${outputFile}`);
};

const filesToProcess = (path = '/data/events') => {
    var allFiles = fs.readdirSync(path);
    var validJsonl = allFiles.filter((fn) => isMatch(fn));
    var filtered = validJsonl.filter(
        (fn) => !allFiles.includes(fn.replace('.jsonl', '.parquet'))
    );
    return filtered.map((item) => `${path}/${item}`);
};

// return bool indicating whether filename matches eventlog file naming convention
// and is not today's log file
const isMatch = (fname) => {
    // today's file never matches, because it's still being written to
    todayPattern = new RegExp(
        new Date().toISOString().substring(0, 10) + '.jsonl'
    );

    if (fname.match(/\d{4}-\d{2}-\d{2}\.jsonl/) && !fname.match(todayPattern)) {
        return true;
    }
    return false;
};

module.exports = {
    run,
    isMatch,
    filesToProcess,
    convertFile,
};
