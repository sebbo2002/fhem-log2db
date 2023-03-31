#!/usr/bin/env node
'use strict';

import config from '../lib/config.js';

const args = process.argv.splice(2);
const cmd = args.shift();

if(cmd === 'install-path') {
    console.log(config.scriptPath);
} else {
    import('../lib/index.js')
        .then(fhemLog2Db => fhemLog2Db.default(cmd, args))
        .catch(error => {
            console.log(error);
            process.exit(1);
        });
}
