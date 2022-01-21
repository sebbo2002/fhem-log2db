'use strict';

import fhemLog2Db from '../../src/lib';

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
});
