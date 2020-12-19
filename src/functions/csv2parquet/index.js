// run is the default entrypoint for Azure Functions
const run = async function (context, req) {
    const { ContainerClient } = require('@azure/storage-blob');

    const client = new ContainerClient(
        process.env.AzureWebJobsStorage,
        'eventlog'
    );

    let blobToConvert = await nextBlob(context, client);
    context.log(`blobToConvert is ${blobToConvert}`);

    // await blob.createIfNotExists();
    // await blob.appendBlock(data, Buffer.byteLength(data, 'utf8'));

    // end the function
    context.done();
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
        context.log(`Blob ${fname}: hit`);
        return true;
    } else {
        context.log(`Blob ${fname}: miss`);
    }
    return false;
};

module.exports = {
    run: run,
    isMatch: isMatch,
};
