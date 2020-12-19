module.exports = async function (context, req) {
    const { ContainerClient } = require('@azure/storage-blob');

    const client = new ContainerClient(
        process.env.AzureWebJobsStorage,
        'eventlog'
    );

    todayPattern = new RegExp(
        new Date().toISOString().substring(0, 10) + '.jsonl'
    );
    let blobToConvert = await nextBlob(context, client, [todayPattern]);
    context.log(`blobToConvert is ${blobToConvert}`);

    // await blob.createIfNotExists();
    // await blob.appendBlock(data, Buffer.byteLength(data, 'utf8'));

    // end the function
    context.done();
};

// return the first blob matching any pattern and NOT an excludes pattern
const nextBlob = async (
    context,
    containerClient,
    excludes = [],
    patterns = [/\d{4}-\d{2}-\d{2}\.jsonl/]
) => {
    let i = 1;
    const iter = containerClient.listBlobsFlat();
    let result = await iter.next();
    while (!result.done) {
        name = result.value.name;
        if (
            patterns.any((item) => name.match(item)) &&
            !exceptions.any((item) => name.match(item))
        ) {
            context.log(`Blob ${i++}: ${name} - hit`);
            return result;
        } else {
            context.log(`Blob ${i++}: ${name} - miss`);
        }
        result = await iter.next();
    }
};
