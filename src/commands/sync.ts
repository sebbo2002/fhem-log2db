import config from '../lib/config';
import { getClient } from '../prisma';
import runFileWalker  from '../lib/filewalker';
import { parseLine } from '../lib/line-parser';
import Task from '../lib/task';

async function syncPath(path: string, syncFrom?: Date): Promise<void> {
    await runFileWalker({
        file: path,
        callback: (line: string, file: string) => syncLine(line, file, syncFrom)
    });
}


async function syncLine(line: string, file: string, syncFrom?: Date): Promise<void> {
    const prisma = getClient();
    if (!prisma) {
        throw new Error('Unable to sync: prisma is not ready');
    }

    const data = parseLine(line);
    if (!data || (syncFrom && data.timestamp < syncFrom)) {
        return;
    }

    try {
        await prisma.history.upsert({
            where: {
                timestamp_device_reading: {
                    timestamp: data.timestamp,
                    device: data.device,
                    reading: data.reading
                }
            },
            update: {
                event: data.event,
                value: data.value,
                unit: data.unit
            },
            create: data
        });
    }
    catch(error) {
        if(String(error).includes('Unique constraint failed on the constraint')) {
            return;
        }

        console.log('----');
        console.log(error);
        console.log(data);
        console.log('----');

        throw error;
    }
}

export default async function syncCommand(args: string[] = []) {
    const prisma = getClient();
    if (!prisma) {
        throw new Error('Unable to sync: prisma is not ready');
    }

    const thisExecution = await prisma.execution.create({
        data: {
            type: 'sync',
            started: new Date()
        }
    });

    const paths = args.length > 0 ? args : [config.defaultPath];
    for (const path of paths) {
        let syncFrom: Date | undefined;

        if (path === config.defaultPath) {
            const prepareTask = new Task('Check what has to be synced in default path');
            const lastExecution = await prisma.execution.findFirst({
                where: {
                    type: 'sync',
                    completed: {
                        not: null
                    },
                    started: {
                        not: thisExecution.started
                    }
                },
                orderBy: [{
                    started: 'desc'
                }]
            });

            syncFrom = lastExecution?.started;
            prepareTask.log(`Last successfull sync at ${syncFrom || '-'}`);

            const periodStart = config.periodStart;
            if(config.period > 0 && periodStart !== null) {
                prepareTask.log(`Configured period starts at ${periodStart}`);

                if(!syncFrom || syncFrom < periodStart) {
                    syncFrom = periodStart;
                }
            }

            prepareTask.log(`Sync default path starting from ${syncFrom}`);
            prepareTask.finally();
        }

        await syncPath(path, syncFrom);
    }

    await prisma.execution.update({
        where: {
            id: thisExecution.id
        },
        data: {
            completed: new Date()
        }
    });
}
