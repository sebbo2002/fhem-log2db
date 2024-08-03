import { readFile } from 'fs/promises';
import { join } from 'path';

export default async function helpCommand() {
    console.log('# fhem-log2db');

    try {
        const pkg = JSON.parse(await readFile(join(__dirname, '..', '..', 'package.json'), 'utf8'));
        console.log(`  Version ${pkg.version}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch(error) {
        // ignore error
    }

    console.log('');

    console.log('> fhemlog2db setup  →  Re-run setup script to write ~/fhem-log2db.config.json');
    console.log('> fhemlog2db config →  Print current configuration');
    console.log('> fhemlog2db sync   →  Sync files in default path to database');
    console.log('> fhemlog2db clean  →  Delete old values in database');
    console.log('> fhemlog2db cron   →  Run both sync and clean jobs');
}