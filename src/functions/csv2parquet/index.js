module.exports = async function (context, req) {
    const { ContainerClient } = require('@azure/storage-blob');

    const client = new ContainerClient(
        process.env.AzureWebJobsStorage,
        'eventlog'
    );

    await nextBlob(context, client);

    // await blob.createIfNotExists();
    // await blob.appendBlock(data, Buffer.byteLength(data, 'utf8'));

    // end the function
    context.done();
};

const nextBlob = async (context, containerClient, excludes = []) => {
    var i = 1;
    let iterator = containerClient.listBlobsFlat().byPage({ maxPageSize: 20 });
    let response = await iterator.next();
    while (!response.done) {
        const segment = response.value.segment;
        for (const blob of segment.blobItems) {
            context.log(`Blob ${i++}: ${blob.name}`);
        }
        response = await iterator.next();
    }
};
