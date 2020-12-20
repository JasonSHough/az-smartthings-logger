const { ContainerClient } = require('@azure/storage-blob');

// run is the default entrypoint for Azure Functions
const run = async function (context, req) {
    const client = new ContainerClient(
        process.env.AzureWebJobsStorage,
        'eventlog'
    );

    context.log(`Scanning for blobs to convert...`);

    let blobToConvert = await nextBlob(context, client);
    if (blobToConvert) {
        context.log(`Converting ${blobToConvert}`);
        await convertBlob(context, blobToConvert);
        context.log(`Finished.`);
    } else {
        context.log(`No blobs found to convert.`);
    }

    // end the function
    context.done();
};

// file operations to read .jsonl and write .parquet
const convertBlob = async (context, jsonlBlob) => {
    // await blob.createIfNotExists();
    // await blob.appendBlock(data, Buffer.byteLength(data, 'utf8'));
};

// return the first blob satisfied by isMatch()
const nextBlob = async (context, containerClient) => {
    let i = 1;
    const iter = containerClient.listBlobsFlat();
    let result = await iter.next();
    while (!result.done) {
        if (isMatch(context, result.value.name)) {
            return result;
        }
        result = await iter.next();
    }
};

// return bool indicating whether filename matches eventlog file naming convention
// and is not today's log file
const isMatch = (context, fname) => {
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
    run: run,
    isMatch: isMatch,
};
