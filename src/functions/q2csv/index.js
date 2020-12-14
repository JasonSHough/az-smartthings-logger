module.exports = async function (context, req) {
  const { AppendBlobClient } = require('@azure/storage-blob');

  // accept either object of JSON string which can be converted to object
  // "{\"date\":\"2020-12-13T21:15:10.047Z\",\"hub\":\"9f44af4b-6337-45b2-ad8a-71261e45b666\",\"deviceId\":\"892870e8-9d95-4b02-a3b6-6ded56f162fe\",\"deviceType\":\"security\",\"eventId\":\"4829d600-3d88-11eb-94f5-0aee323e0c51\",\"device\":\"Great Room Motion\",\"property\":\"motion\",\"value\":\"inactive\",\"unit\":null,\"isphysical\":false,\"isstatechange\":true,\"source\":\"DEVICE\",\"location\":\"Home\"}"
  try {
    req = JSON.parse(req);
    context.log('parsed');
  } catch (e) {
    context.log(`error parsing ${e}`);
  }

  context.log(`input is ${JSON.stringify(req)}`);

  // determine the filename to append this event to, based on timestamp
  var fname = req.date.substring(0, 10) + '.jsonl' || 'bad_data.jsonl';
  context.log(`appending to ${fname}`);
//   context.log(`AzureWebJobsStorage value is ${process.env.AzureWebJobsStorage}`);

  var data = JSON.stringify(req);
  const blob = new AppendBlobClient(process.env.AzureWebJobsStorage, 'eventlog', fname);
  await blob.createIfNotExists();
  await blob.appendBlock(data, Buffer.byteLength(data, 'utf8'));

  context.done();
};
