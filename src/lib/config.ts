import { existsSync, readFileSync } from 'fs';
import { writeFile} from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { validateDatabaseUri } from '../prisma/index.js';
import { cwd } from 'process';
import { fileURLToPath } from 'url';

export interface ConfigSchema {
    path?: string;
    database?: string;
    period?: number;
}

export class Config {
    private readonly configPath: string;
    private readonly configData: ConfigSchema = {};

    constructor () {
        let configPath: string | undefined;
        if (process.env.FHEM_LOG2DB_CONFIG) {
            configPath = process.env.FHEM_LOG2DB_CONFIG;
        }
        else if (process.env.HOME) {
            configPath = join(process.env.HOME, 'fhem-log2db.config.json');
        }
        else {
            throw new Error(
                'Unable to load configuration: HOME environment variable is not set. Please set HOME or use '+
                'FHEM_LOG2DB_CONFIG to set the path to the configuration file.'
            );
        }

        this.configPath = resolve(cwd(), configPath);
        if(existsSync(configPath)) {
            this.configData = JSON.parse(readFileSync(this.configPath, 'utf8'));
        }
    }

    get scriptPath(): string {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        return resolve(__dirname, '..', '..');
    }

    get configFilePath(): string {
        return this.configPath;
    }

    get defaultPath(): string {
        return this.configData.path ?
            resolve(dirname(this.configFilePath), this.configData.path) :
            '/opt/fhem/log';
    }

    set defaultPath(path: string) {
        this.configData.path = path;
    }

    get database(): string {
        return this.configData.database || 'mysql://root@localhost';
    }

    set database(uri: string) {
        this.configData.database = uri;
    }

    get period(): number {
        return this.configData.period || 60 * 60 * 24 * 30;
    }

    set period(period: number) {
        this.configData.period = period;
    }

    get periodStart(): Date | null {
        return this.period > 0 ? new Date(new Date().getTime() - this.period * 1000) : null;
    }

    async isValid(): Promise<void> {
        await Promise.all([
            this.isValidDefaultPath(),
            this.isValidDatabase(),
            this.isValidPeriod()
        ]);
    }

    async isValidDefaultPath(defaultPath: string = this.defaultPath): Promise<void> {
        if(!existsSync(defaultPath)) {
            throw new Error(`Logfile path ${defaultPath} does not exist.`);
        }
    }

    async isValidDatabase(database: string = this.database): Promise<void> {
        await validateDatabaseUri(database);
    }

    async isValidPeriod(period: number = this.period): Promise<void> {
        if(period < 0) {
            throw new Error('Period must be a positive number or 0 if everything has to be synced.');
        }
    }

    async save() {
        await writeFile(this.configPath, JSON.stringify(this.configData, null, '  '));
    }
}

const config = new Config;
export default config;
