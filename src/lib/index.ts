import setupCommand from '../commands/setup';
import config from './config';
import configCommand from '../commands/config';
import prisma, { connect } from '../prisma';
import syncCommand  from '../commands/sync';
import cleanCommand from '../commands/clean';
import helpCommand from '../commands/help';
import Task, { TaskMessageLevel } from './task';
import { PrismaClient } from '@prisma/client';

export default async function fhemLog2Db (cmd: string | undefined, args: string[]) {
    if(args.includes('-v')) {
        Task.setLevel(TaskMessageLevel.Debug);
    }
    else if(cmd === 'cron') {
        Task.setLevel(TaskMessageLevel.Error);
    }

    if(cmd === 'setup') {
        await setupCommand();
        return;
    }

    try {
        await config.isValid();
    }
    catch(error) {
        console.log(error);
        console.log('');
        console.log('Run setup command to update configuration:');
        await setupCommand();
    }

    if(cmd === 'config') {
        await configCommand();
        return;
    }

    connect();

    try {
        await fhemLog2DbSyncAndClean(cmd, args);
    }
    finally {
        prisma?.$disconnect();
    }
}

async function fhemLog2DbSyncAndClean (cmd: string | undefined, args: string[]) {
    if (cmd === 'sync') {
        await syncCommand(args);
    }
    else if (cmd === 'clean') {
        await cleanCommand();
    }
    else if (cmd === 'cron') {
        await syncCommand(args);
        await cleanCommand();
    }
    else {
        await helpCommand();
    }
}

export function isRunning(pid: number) {
    try {
        return process.kill(pid,0);
    }
    catch (e: unknown) {
        return String(e).includes('EPERM');
    }
}

export async function checkRunningProcesses (prisma: PrismaClient) {
    const runningExecution = await prisma.execution.findFirst({
        where: {
            completed: null
        },
        orderBy: [{
            started: 'desc'
        }]
    });
    if(runningExecution && runningExecution.pid && isRunning(runningExecution.pid)) {
        throw new Error(`There's another ${runningExecution.type} process running, please wait till it's done (${runningExecution.pid}, running since ${runningExecution.started})`);
    }
    if(runningExecution && !runningExecution.pid) {
        throw new Error(`There's another ${runningExecution.type} process running, please wait till it's done (running since ${runningExecution.started})`);
    }
}
