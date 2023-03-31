import config from '../lib/config.js';
import { getClient } from '../prisma/index.js';
import { createTask } from '../lib/task.js';
import { checkRunningProcesses } from '../lib/index.js';

export default async function cleanCommand() {
    const prisma = getClient();
    if (!prisma) {
        throw new Error('Unable to clean: prisma is not ready');
    }

    await checkRunningProcesses(prisma);
    await createTask('Clean database', async (task) => {
        const periodStart = config.periodStart;
        if(periodStart === null) {
            task.log('Period is set to 0 – skip cleaning.');
            return;
        }

        task.log(`Remove items with timestamp < ${periodStart}`);
        const thisExecution = await prisma.execution.create({
            data: {
                type: 'clean',
                pid: process.pid,
                started: new Date()
            }
        });

        await prisma.history.deleteMany({
            where: {
                timestamp: {
                    lt: periodStart
                }
            }
        });

        await prisma.execution.update({
            where: {
                id: thisExecution.id
            },
            data: {
                completed: new Date()
            }
        });
    });
}
