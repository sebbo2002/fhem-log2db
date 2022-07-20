'use strict';

import { parseLine } from '../../src/lib/line-parser.js';
import assert from 'assert';

describe('parseLine', function () {
    it('should work', async function () {
        const l = parseLine('2022-01-01_02:30:41 ZWave_SENSOR_MULTILEVEL_3 battery: 100');
        assert.deepStrictEqual(l, {
            timestamp: new Date('2022-01-01T02:30:41'),
            device: 'ZWave_SENSOR_MULTILEVEL_3',
            event: 'battery: 100',
            reading: 'battery',
            value: '100',
            unit: null
        });
    });
    it('should handle float units', async function () {
        const l = parseLine('2022-01-01_02:30:41 ZWave_SENSOR_MULTILEVEL_3 battery: 100.0 %');
        assert.deepStrictEqual(l, {
            timestamp: new Date('2022-01-01T02:30:41'),
            device: 'ZWave_SENSOR_MULTILEVEL_3',
            event: 'battery: 100.0 %',
            reading: 'battery',
            value: '100.0',
            unit: '%'
        });
    });
    it('should handle timestamps', async function () {
        const l = parseLine('2022-01-01_02:30:41 ZWave_SENSOR_MULTILEVEL_3 time: 2022-1-23 16:29:1');
        assert.deepStrictEqual(l, {
            timestamp: new Date('2022-01-01T02:30:41'),
            device: 'ZWave_SENSOR_MULTILEVEL_3',
            event: 'time: 2022-1-23 16:29:1',
            reading: 'time',
            value: '2022-1-23 16:29:1',
            unit: null
        });
    });
});
