#!/usr/bin/env node
'use strict';

import fhemLog2Db from '../lib';

const m = require.main;
if(!m) {
    console.log('Unable to run: ');
    process.exit(1);
}

const i = process.argv.indexOf(m.filename);
const args = process.argv.splice(i + 1);
const cmd = args.shift();

fhemLog2Db(cmd, args).catch(error => {
    console.log(error);
    process.exit(1);
});
