import { lstat, mkdtemp, readdir, rm } from 'fs/promises';
import { createReadStream, Dirent, Stats } from 'node:fs';
import { join, extname } from 'path';
import { createInterface, Interface } from 'readline';
import extractZip from 'extract-zip';
import targz from 'targz';
import { tmpdir } from 'os';
import Task from './task.js';
import EventEmitter from 'events';

const { decompress: extractTarGz } = targz;


export interface FileWalkerOptions {
    file: string;
    callback: FileWalkerCallback;
    batchSize?: number;
}

export interface FileWalkerBaton {
    internalPath: string;
    externalPath: string;
    options: FileWalkerOptions;
    queue: FileWalkerQueue;
}

type FileWalkerCallback = (line: string, file: string) => Promise<void>;
type FileWalkerUnarchiverCb = (archive: string, directory: string) => Promise<void>;

class FileWalkerBatchCounter {
    private c = 0;
    private paused = false;
    private readonly rl: Interface;
    private readonly batchSize: number;

    constructor (rl: Interface, options: FileWalkerOptions) {
        this.rl = rl;
        this.batchSize = options.batchSize ? options.batchSize * 50 : 250;
    }

    get value () {
        return this.c;
    }

    up () {
        this.c++;

        if (this.c >= this.batchSize && !this.paused) {
            this.paused = true;
            this.rl.pause();
        }
    }

    down () {
        this.c--;

        if (this.c < this.batchSize * 0.8 && this.paused) {
            this.paused = false;
            this.rl.resume();
        }
    }
}

class FileWalkerQueue {
    private readonly batchSize;
    private readonly events = new EventEmitter;
    private readonly queue: Array<() => Promise<void>> = [];
    private running = 0;

    constructor (batchSize?: number) {
        this.batchSize = batchSize || 20;
    }

    public add (fn: () => Promise<void>): Promise<void> {
        return new Promise(cb => {
            this.queue.push(() =>
                fn().finally(() => cb())
            );
            this.check();
        });
    }

    public check () {
        if (this.running >= this.batchSize) {
            return;
        }

        const task = this.queue.shift();
        if (!task) {
            this.events.emit('empty');
            return;
        }

        this.running++;
        task().finally(() => {
            this.running--;
            this.check();
        });
    }

    public empty (): Promise<void> {
        if(this.queue.length === 0) {
            return Promise.resolve();
        }

        return new Promise(cb => {
            this.events.once('empty', () => cb());
        });
    }
}

async function createTemporaryFolder () {
    return mkdtemp(join(tmpdir(), 'fhem-log2db–'));
}

async function countLines (file: string): Promise<number> {
    const rl = createInterface({
        input: createReadStream(file)
    });

    let lines = 0;
    rl.on('line', () => lines++);

    return new Promise(cb =>
        rl.on('close', () => cb(lines))
    );
}

async function onFolder (baton: FileWalkerBaton): Promise<void> {
    const files = await readdir(baton.internalPath, { withFileTypes: true });
    for (const file of files) {
        const newBaton = Object.assign({}, baton, {
            internalPath: join(baton.internalPath, file.name),
            externalPath: join(baton.externalPath, file.name)
        });

        await runOnSomething(newBaton, file);
    }
}

async function onFile (baton: FileWalkerBaton): Promise<void> {
    const ext = extname(baton.internalPath);

    if (ext === '.log') {
        await onLogFile(baton);
    } else if (ext === '.zip') {
        await onZipFile(baton);
    } else if (ext === '.gz' && baton.internalPath.endsWith('.tar.gz')) {
        await onTarGzFile(baton);
    }
}

async function onLogFile (baton: FileWalkerBaton): Promise<void> {
    const task = new Task('Sync ' + baton.externalPath);
    const lines = await countLines(baton.internalPath);
    const rl = createInterface({
        input: createReadStream(baton.internalPath)
    });

    const counter = new FileWalkerBatchCounter(rl, baton.options);

    let lineNr = 0;
    rl.on('line', (line: string) => {
        const myLine = lineNr;

        // Skip lines added after imports starts
        if (myLine > lines) {
            return;
        }

        onLine(Object.assign({}, baton, {
            externalPath: baton.externalPath + ':' + ++lineNr
        }), line, counter, task, baton.options.callback).then(() => {
            task.progress(myLine / lines);
        });
    });

    await new Promise(resolve => {
        rl.on('close', () => resolve(null));
    });

    await baton.queue.empty();
    task.finally();
}

async function onZipFile (baton: FileWalkerBaton): Promise<void> {
    await onArchive(baton, async (archive, dir) =>
        extractZip(archive, { dir })
    );
}

async function onTarGzFile (baton: FileWalkerBaton): Promise<void> {
    await onArchive(baton, async (src, dest) => new Promise((resolve, reject) => {
        extractTarGz({ src, dest }, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }));
}

async function onArchive (baton: FileWalkerBaton, extractor: FileWalkerUnarchiverCb): Promise<void> {
    const dir = await createTemporaryFolder();

    try {
        await extractor(baton.internalPath, dir);
        await onFolder(Object.assign({}, baton, {
            internalPath: dir
        }));
    } finally {
        await rm(dir, {
            force: true,
            maxRetries: 20,
            recursive: true
        });
    }
}

async function onLine (baton: FileWalkerBaton, line: string, counter: FileWalkerBatchCounter, task: Task, cb: FileWalkerCallback): Promise<void> {
    counter.up();

    return baton.queue.add(async () => {
        try {
            await cb(line, baton.externalPath);
        }
        catch (error) {
            task.warn(`Unable to sync ${line}: ${error}`);
        }
        finally {
            counter.down();
        }
    });
}

async function runOnSomething (baton: FileWalkerBaton, something: Stats | Dirent): Promise<void> {
    if (something.isDirectory()) {
        await onFolder(baton);
    }
    if (something.isFile()) {
        await onFile(baton);
    }
}

export default async function runFileWalker (options: FileWalkerOptions) {
    const f = await lstat(options.file);
    await runOnSomething({
        internalPath: options.file,
        externalPath: options.file,
        queue: new FileWalkerQueue(options.batchSize),
        options: options
    }, f);
}
