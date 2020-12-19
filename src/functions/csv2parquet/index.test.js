const { ContainerClient } = require('@azure/storage-blob');
const { expect } = require('@jest/globals');
jest.mock('@azure/storage-blob');
const func = require('./index').default;
const isMatch = require('./index').isMatch;

// mock the inputs provided in the function invocation
const contextMockFactory = () => {
    return {
        log: jest.fn(),
        done: jest.fn(),
    };
};

beforeEach(() => {
    ContainerClient.mockClear();
});

test('isMatch returns valid matches', async () => {
    contextMock = contextMockFactory();
    expect(isMatch(contextMock, '2017-01-01.jsonl')).toBeTruthy();
    expect(isMatch(contextMock, '2017-01-01.parquet')).toBeFalsy();
    expect(isMatch(contextMock, 'test.csv')).toBeFalsy();
});

test('isMatch returns false for current date', async () => {
    contextMock = contextMockFactory();
    let todayFile = new Date().toISOString().substring(0, 10) + '.jsonl';
    expect(isMatch(contextMock, todayFile)).toBeFalsy();
});
