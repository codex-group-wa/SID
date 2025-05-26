"use server"

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
import { findAllDockerComposeFiles } from './process';

const adapter = new PrismaBetterSQLite3({
  url: "file:./prisma/dev.db"
});
const prisma = new PrismaClient({ adapter });

export async function createStack(formData: any) {
    const response = await prisma.stack.create({
        data: {
            name: formData.name,
            status: 'created',
            path: formData.filePath
        }
    })
    createEvent('Success', `Stack created: ${formData.name}`)
    revalidatePath('/');
    return response
}

export async function syncStacks() {
    const composeFiles = await findAllDockerComposeFiles();
    if (!composeFiles || composeFiles.length === 0) {
        console.info("No docker-compose files found.");
        return [];
    }

    const stacksCreated: any[] = [];
    for (const filePath of composeFiles) {
        // Get the parent folder as the stack name
        const parts = filePath.split('/');
        const stackName = parts[parts.length - 2]; // parent folder
        try {
            // Upsert: create if not exists, else update path/status
            const stack = await prisma.stack.upsert({
                where: { name: stackName },
                update: {
                    path: filePath,
                    status: 'synced',
                    updatedAt: new Date()
                },
                create: {
                    name: stackName,
                    path: filePath,
                    status: 'synced'
                }
            });
            stacksCreated.push(stack);
            await createEvent('Info', `Stack synced: ${stackName}`);
        } catch (err: any) {
            console.error(`Failed to sync stack for ${filePath}: ${err.message}`);
            await createEvent('Error', `Failed to sync stack for ${filePath}: ${err.message}`);
        }
    }
    // Revalidate only if there were compose files to process.
    // And ideally, only if at least one stack was successfully synced/created.
    // For simplicity, we'll revalidate if composeFiles were found,
    // assuming an attempt to sync was made.
    if (composeFiles && composeFiles.length > 0) {
        revalidatePath('/');
    }
    return stacksCreated;
}

export async function getStacks() {
    const response = await prisma.stack.findMany({
        include: {
            events: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
        },
    })
    return response
}

export async function createEvent(type: string, message: any, stackName?: string) {
    const response = await prisma.event.create({
        data: {
            type: type,
            message: message,
            stack: {
                connect: stackName ? { name: stackName } : undefined
            },
        }
    });
    return response;
}

export async function getEvents(page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const [events, total] = await Promise.all([
        prisma.event.findMany({
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            include: { stack: true },
        }),
        prisma.event.count(),
    ]);
    return { events, total };
}