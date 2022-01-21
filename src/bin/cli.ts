#!/usr/bin/env node
'use strict';

import config from '../lib/config';

const m = require.main;
if(!m) {
    console.log('Unable to run: ');
    process.exit(1);
}

const i = process.argv.indexOf(m.filename);
const args = process.argv.splice(i + 1);
const cmd = args.shift();

if(cmd === 'install-path') {
    console.log(config.scriptPath);
} else {
    import('../lib')
        .then(fhemLog2Db => fhemLog2Db.default(cmd, args))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
}
