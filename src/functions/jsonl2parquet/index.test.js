const { expect } = require('@jest/globals');
const tmp = require('tmp');
const fs = require('fs');
const parquet = require('parquetjs-lite');
const func = require('./index').run;
const isMatch = require('./index').isMatch;
const filesToProcess = require('./index').filesToProcess;
const convertFile = require('./index').convertFile;

const reqMockStr =
    '{"date":"2020-12-13T21:15:10.047Z","hub":"9f44af4b-6337-45b2-ad8a-71261e45b666","deviceId":"892870e8-9d95-4b02-a3b6-6ded56f162fe","deviceType":"security","eventId":"4829d600-3d88-11eb-94f5-0aee323e0c51","device":"Great Room Motion","property":"motion","value":"inactive","unit":null,"isphysical":false,"isstatechange":true,"source":"DEVICE","location":"Home"}';

const reqMockObj = JSON.parse(reqMockStr);

test('isMatch returns valid matches', () => {
    expect(isMatch('2017-01-01.jsonl')).toBeTruthy();
    expect(isMatch('2017-01-01.parquet')).toBeFalsy();
    expect(isMatch('test.csv')).toBeFalsy();
});

test('isMatch returns false for current date', () => {
    let todayFile = new Date().toISOString().substring(0, 10) + '.jsonl';
    expect(isMatch(todayFile)).toBeFalsy();
});

test('fileToProcess returns correct values', () => {
    const path = `${tmp.dirSync().name}`;
    todayFile = new Date().toISOString().substring(0, 10) + '.jsonl';
    const files = [
        'blah.txt',
        '2019-01-01.jsonl',
        '2019-01-02.jsonl',
        todayFile,
    ].map((item) => `${path}/${item}`);

    const validFiles = ['2019-01-01.jsonl', '2019-01-02.jsonl'].map(
        (item) => `${path}/${item}`
    );

    // create some temp files
    for (const file of files) {
        fs.closeSync(fs.openSync(file, 'w'));
    }
    expect(filesToProcess(path).sort()).toEqual(validFiles.sort());
});

test('Can convert jsonl to parquet', async () => {
    const path = tmp.dirSync().name;
    jsonlFile = `${path}/test.jsonl`;
    parquetFile = `${path}/test.parquet`;

    // create 3 line jsonl file
    for (var i = 0; i < 2; i++) {
        var data = `${JSON.stringify(reqMockObj)}\n`;
        fs.appendFileSync(jsonlFile, data, 'utf8');
    }

    await convertFile(jsonlFile);

    let reader = await parquet.ParquetReader.openFile(parquetFile);
    let cursor = reader.getCursor();

    let record = null;
    for (var i = 0; i < 2; i++) {
        let record = await cursor.next();
        record.unit = null; // parquet doesn't return missing fields; add it so compare works
        expect(record).toMatchObject(reqMockObj);
    }
    await reader.close();
});
