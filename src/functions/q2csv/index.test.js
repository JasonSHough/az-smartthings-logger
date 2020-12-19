const { AppendBlobClient } = require('@azure/storage-blob');
const { expect } = require('@jest/globals');
jest.mock('@azure/storage-blob');
const func = require('./index');

// mock the inputs provided in the function invocation
const contextMockFactory = () => {
    return {
        log: jest.fn(),
        done: jest.fn(),
    };
};
const reqMockStr =
    '{"date":"2020-12-13T21:15:10.047Z","hub":"9f44af4b-6337-45b2-ad8a-71261e45b666","deviceId":"892870e8-9d95-4b02-a3b6-6ded56f162fe","deviceType":"security","eventId":"4829d600-3d88-11eb-94f5-0aee323e0c51","device":"Great Room Motion","property":"motion","value":"inactive","unit":null,"isphysical":false,"isstatechange":true,"source":"DEVICE","location":"Home"}';

const reqMockObj = JSON.parse(reqMockStr);

beforeEach(() => {
    AppendBlobClient.mockClear();
});

test('accepts string of JSON', async () => {
    contextMock = contextMockFactory();
    await func(contextMock, reqMockStr);
    expect(contextMock.log).toHaveBeenCalledWith(
        'JSON string parsed successfully.'
    );
});

test('accepts object', async () => {
    contextMock = contextMockFactory();
    await func(contextMock, reqMockObj);
    expect(contextMock.log).toHaveBeenCalledWith('Object received.');
});

test('throws on poorly formatted JSON', async () => {
    contextMock = contextMockFactory();
    await expect(async () => {
        await func(contextMock, '{"blah":"true"');
    }).rejects.toThrow('Unexpected end of JSON input');
});

test('throws on missing properties', async () => {
    contextMock = contextMockFactory();
    await expect(async () => {
        await func(contextMock, { hub: 'blah' });
    }).rejects.toThrow('Object does not match expected schema.');
});

test('throws on invalid date', async () => {
    contextMock = contextMockFactory();
    await expect(async () => {
        await func(contextMock, { date: 'blah' });
    }).rejects.toThrow('Object does not match expected schema.');
});

test('AppendBlock called with the proper data and length', async () => {
    contextMock = contextMockFactory();
    await func(contextMock, reqMockStr);

    appendblobclientinstance = AppendBlobClient.mock.instances[0];
    const bytelength = Buffer.byteLength(reqMockStr + '\n', 'utf8');
    expect(appendblobclientinstance.appendBlock).toHaveBeenCalledWith(
        reqMockStr + '\n',
        bytelength
    );
});

test('AppendBlobClient constructred with proper file name', async () => {
    contextMock = contextMockFactory();
    await func(contextMock, reqMockStr);

    expect(AppendBlobClient).toHaveBeenCalledWith(
        undefined,
        'eventlog',
        '2020-12-13.jsonl'
    );
});
