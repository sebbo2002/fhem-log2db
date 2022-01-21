import prompts from 'prompts';
import config from '../lib/config';
import { createTask } from '../lib/task';

export default async function setupCommand() {
    const { defaultPath, database } = await prompts([
        {
            type: 'text',
            name: 'defaultPath',
            message: 'Where are the FHEM log files that are to be transferred?',
            initial: config.defaultPath,
            validate: async (value: string) => {
                try {
                    await config.isValidDefaultPath(value);
                    return true;
                }
                catch(error) {
                    return String(error);
                }
            }
        },
        {
            type: 'text',
            name: 'database',
            message: 'To which database should the data be copied?',
            initial: config.database,
            validate: async (value: string) => {
                try {
                    await config.isValidDatabase(value);
                    return true;
                }
                catch(error) {
                    return String(error);
                }
            }
        },
        {
            type: 'number',
            name: 'period',
            message: 'What is the maximum number of days to be synchronized.',
            initial: Math.round(config.period / 60 / 60 / 24),
            format: number => number * 60 * 60 * 24,
            min: 0,
            float: true,
            validate: async (value: number) => {
                try {
                    await config.isValidPeriod(value);
                    return true;
                }
                catch(error) {
                    return String(error);
                }
            }
        }
    ]);
    if(!defaultPath) {
        throw new Error('Unable to update configuration: default path is not valid.');
    }
    if(!database) {
        throw new Error('Unable to update configuration: database is not valid.');
    }

    config.defaultPath = defaultPath;
    config.database = database;

    await createTask(`Save settings in ${config.configFilePath}`, () => config.save());
}
