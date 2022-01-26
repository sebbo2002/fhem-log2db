import setupCommand from '../commands/setup';
import config from './config';
import configCommand from '../commands/config';
import prisma, { connect } from '../prisma';
import syncCommand from '../commands/sync';
import cleanCommand from '../commands/clean';
import helpCommand from '../commands/help';
import Task, { TaskMessageLevel } from './task';

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
