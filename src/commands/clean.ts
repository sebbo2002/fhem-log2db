import config from '../lib/config';
import { getClient } from '../prisma';
import { createTask } from '../lib/task';

export default async function cleanCommand() {
    const prisma = getClient();
    if (!prisma) {
        throw new Error('Unable to clean: prisma is not ready');
    }

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
