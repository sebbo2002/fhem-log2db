export type CreateTaskFn<T> = (task: Task) => Promise<T>;
export enum TaskMessageLevel {
    Debug,
    Log,
    Warning,
    Error
}

export type TaskMessageDebug = [TaskMessageLevel.Debug, string];
export type TaskMessageLog = [TaskMessageLevel.Log, string];
export type TaskMessageWarning = [TaskMessageLevel.Warning, string];
export type TaskMessageError = [TaskMessageLevel.Error, Error | unknown];
export type TaskMessage = TaskMessageDebug | TaskMessageLog | TaskMessageWarning | TaskMessageError;

export async function createTask<T>(name: string, fn: CreateTaskFn<T>): Promise<T> {
    const task = new Task(name);

    try {
        return await fn(task);
    }
    catch(error) {
        task.error(error);
        throw error;
    }
    finally {
        task.finally();
    }
}

export default class Task {
    static level: TaskMessageLevel = TaskMessageLevel.Log;

    private readonly name: string;
    private readonly messages: TaskMessage[] = [];
    private lastProgress: number | undefined;
    private statusLength = 0;
    private pending = true;

    static setLevel(level: TaskMessageLevel) {
        this.level = level;
    }

    constructor(name: string) {
        this.name = name;

        if (Task.level === TaskMessageLevel.Log) {
            process.stdout.write(`${name}…`);
        }
    }

    private status(message: string) {
        if (Task.level !== TaskMessageLevel.Log) {
            return;
        }

        this.statusLength = Math.max(this.statusLength, message.length);
        process.stdout.write('\r' + this.statusFiller(message));
    }

    private statusFiller(message: string): string {
        const c = this.statusLength - message.length;
        if(c <= 0) {
            return message;
        }

        return message + (' '.repeat(c));
    }

    debug(message: string) {
        this.messages.push([
            TaskMessageLevel.Debug,
            message
        ]);
    }

    log(message: string) {
        this.messages.push([
            TaskMessageLevel.Log,
            message
        ]);
    }

    warn(message: string) {
        this.messages.push([
            TaskMessageLevel.Warning,
            message
        ]);
    }

    error(error: Error | unknown) {
        this.messages.push([
            TaskMessageLevel.Error,
            error
        ]);
    }

    progress(progress: number) {
        if (this.pending && Task.level === TaskMessageLevel.Log && (!this.lastProgress || progress > this.lastProgress)) {
            this.lastProgress = progress;
            this.status(`${this.name}… (${(progress * 100).toFixed(1)}%)`);
        }
    }

    finally() {
        const relevantMessages = this.messages.filter(([level]) => level >= Task.level);
        const hasFailed = !!this.messages.find(([level]) => level >= TaskMessageLevel.Error);
        this.pending = false;

        if (relevantMessages.length > 0 || Task.level === TaskMessageLevel.Log) {
            const message = `\r${this.name} [${hasFailed ? 'Failed' : 'Ok'}]`;
            console.log(this.statusFiller(message) + ' ');
        }
        if (relevantMessages.length > 0) {
            relevantMessages.forEach(message => {
                if(message[0] === TaskMessageLevel.Debug) {
                    console.log('  |- Debug:', message[1]);
                }
                else if(message[0] === TaskMessageLevel.Log) {
                    console.log('  |-', message[1]);
                }
                else if(message[0] === TaskMessageLevel.Warning) {
                    console.log('  |- Warning:', message[1]);
                }
                else if(message[0] === TaskMessageLevel.Error && message[1] instanceof Error && message[1].stack) {
                    console.log('  |- Error:', message[1].stack.replace(/\n/g, '\n     '));
                }
                else if(message[0] === TaskMessageLevel.Error) {
                    console.log('  |- Error:', message[1]);
                }
            });
        }
    }
}
