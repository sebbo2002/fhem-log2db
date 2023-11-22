import config from '../lib/config.js';

export default async function configCommand() {
    console.log(`fhem-log2db Path: ${config.scriptPath}`);
    console.log(`     Config Path: ${config.configFilePath}`);
    console.log(`        Log Path: ${config.defaultPath}`);
    console.log(`        Database: ${config.database}`);
    console.log(` Period duration: ${config.period} seconds`);
    console.log('');
}
