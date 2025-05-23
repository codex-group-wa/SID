"use server"

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function createStack(formData: any) {
    const response = await prisma.stack.create({
        data: {
            name: formData.name,
            slug: formData.slug,
            path: formData.filePath
        }
    })
    return response
}

export async function getStacks() {
    const response = await prisma.stack.findMany({})
    return response
}