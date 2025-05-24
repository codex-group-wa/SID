"use server"

import { PrismaClient } from '@prisma/client'
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
import { revalidatePath } from 'next/cache';

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
    revalidatePath('/')
    return response
}

export async function getStacks() {
    const response = await prisma.stack.findMany({})
    return response
}

export async function createEvent(type: string, message: any) {
    const response = await prisma.event.create({
        data: {
            type: type,
            message: message
        }
    })
    revalidatePath('/')
    return response
}

export async function getEvents() {
    const response = await prisma.event.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        take: 100
    })
    return response
}