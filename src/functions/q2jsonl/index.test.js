const tmp = require('tmp');
const fs = require('fs');
const { expect } = require('@jest/globals');
const {
    convertReqToObject,
    validateReqSchema,
    generateFileName,
    saveData,
} = require('./index');

const reqMockStr =
    '{"date":"2020-12-13T21:15:10.047Z","hub":"9f44af4b-6337-45b2-ad8a-71261e45b666","deviceId":"892870e8-9d95-4b02-a3b6-6ded56f162fe","deviceType":"security","eventId":"4829d600-3d88-11eb-94f5-0aee323e0c51","device":"Great Room Motion","property":"motion","value":"inactive","unit":null,"isphysical":false,"isstatechange":true,"source":"DEVICE","location":"Home"}';

const reqMockObj = JSON.parse(reqMockStr);

test('accepts string of JSON', () => {
    var result = convertReqToObject(reqMockStr);
    expect(result).toMatchObject(reqMockObj);
});

test('accepts object', async () => {
    var result = convertReqToObject(reqMockObj);
    expect(result).toMatchObject(reqMockObj);
});

test('throws on poorly formatted JSON', async () => {
    expect(() => {
        convertReqToObject('{"blah":"true"');
    }).toThrow('Unexpected end of JSON input');
});

test('throws on missing properties', async () => {
    expect(() => {
        validateReqSchema({ hub: 'blah' });
    }).toThrow('Object does not match expected schema.');
});

test('throws on invalid date', async () => {
    expect(() => {
        validateReqSchema({ date: 'blah' });
    }).toThrow('Object does not match expected schema.');
});

test('Filename generated correctly', () => {
    var result = generateFileName(reqMockObj);
    expect(result).toEqual('2020-12-13.jsonl');
});

test('save data with path present, file missing', () => {
    const basedir = tmp.dirSync().name;
    var fname = generateFileName(reqMockObj);
    saveData(reqMockObj, fname, basedir);

    let result = JSON.parse(fs.readFileSync(`${basedir}/${fname}`));
    expect(result).toMatchObject(reqMockObj);
});

test('save data with path missing', () => {
    const basedir = `${tmp.dirSync().name}/data`;
    var fname = generateFileName(reqMockObj);
    saveData(reqMockObj, fname, basedir);

    let result = JSON.parse(fs.readFileSync(`${basedir}/${fname}`));
    expect(result).toMatchObject(reqMockObj);
});
