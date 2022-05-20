'use strict';

import assert from 'assert';
import fhemLog2Db, { isRunning } from '../../src/lib';

describe('fhem-log2db', function () {
    this.timeout(30000);

    it('config', async function () {
        await fhemLog2Db('config', []);
    });
    it('sync', async function () {
        await fhemLog2Db('sync', []);
    });
    it('clean', async function () {
        await fhemLog2Db('clean', []);
    });
    it('cron', async function () {
        await fhemLog2Db('cron', []);
    });
    it('default', async function () {
        await fhemLog2Db('-', []);
    });

    describe('isRunning()', function () {
        it('should work with existing pids', async function () {
            assert.equal(isRunning(process.pid), true);
        });
        it('should work with non existing pids', async function () {
            assert.equal(isRunning(10000), false);
        });
    });
});
