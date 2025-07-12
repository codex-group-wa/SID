"use server";

import { PrismaClient } from "@prisma/client";
import { findAllDockerComposeFiles } from "./process";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function createStack(formData: any) {
  try {
    console.info(
      `[createStack] Creating stack: ${formData.name} at ${formData.filePath}`,
    );
    const response = await prisma.stack.create({
      data: {
        name: formData.name,
        status: "created",
        path: formData.filePath,
      },
    });
    console.info(`[createStack] Stack created: ${formData.name}`);
    createEvent("Success", `Stack created: ${formData.name}`);
    revalidatePath("/");
    return response;
  } catch (err: any) {
    console.error(`[createStack] Error creating stack: ${err.message}`);
    throw err;
  }
}

export async function syncStacks() {
  console.info("[syncStacks] Finding all docker-compose files...");
  const composeFiles = await findAllDockerComposeFiles();
  if (!composeFiles || composeFiles.length === 0) {
    console.info("[syncStacks] No docker-compose files found.");
    return [];
  }

  const stacksCreated: any[] = [];
  for (const filePath of composeFiles) {
    const parts = filePath.split("/");
    const stackName = parts[parts.length - 2];
    try {
      console.info(`[syncStacks] Upserting stack: ${stackName} (${filePath})`);
      const stack = await prisma.stack.upsert({
        where: { name: stackName },
        update: {
          path: filePath,
          status: "synced",
          updatedAt: new Date(),
        },
        create: {
          name: stackName,
          path: filePath,
          status: "synced",
        },
      });
      stacksCreated.push(stack);
      console.info(`[syncStacks] Stack synced: ${stackName}`);
      await createEvent("Info", `Stack synced: ${stackName}`);
    } catch (err: any) {
      console.error(
        `[syncStacks] Failed to sync stack for ${filePath}: ${err.message}`,
      );
      await createEvent(
        "Error",
        `Failed to sync stack for ${filePath}: ${err.message}`,
      );
    }
  }
  console.info(
    `[syncStacks] Finished syncing stacks. Total: ${stacksCreated.length}`,
  );
  revalidatePath("/");
  return stacksCreated;
}

export async function getStacks() {
  try {
    console.info("[getStacks] Fetching all stacks with latest event...");
    const response = await prisma.stack.findMany({
      include: {
        events: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    console.info(`[getStacks] Found ${response.length} stacks.`);
    return response;
  } catch (err: any) {
    console.error(`[getStacks] Error fetching stacks: ${err.message}`);
    throw err;
  }
}

export async function createEvent(
  type: string,
  message: any,
  stackName?: string,
) {
  try {
    console.info(
      `[createEvent] Creating event: type=${type}, stackName=${stackName}, message=${typeof message === "string" ? message : JSON.stringify(message)}`,
    );
    const response = await prisma.event.create({
      data: {
        type: type,
        message: message,
        stack: {
          connect: stackName ? { name: stackName } : undefined,
        },
      },
    });
    console.info(`[createEvent] Event created: ${response.id}`);
    return response;
  } catch (err: any) {
    console.error(`[createEvent] Error creating event: ${err.message}`);
    throw err;
  }
}

export async function getEvents(page: number, pageSize: number) {
  try {
    const skip = (page - 1) * pageSize;
    console.info(
      `[getEvents] Fetching events: page=${page}, pageSize=${pageSize}, skip=${skip}`,
    );
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { stack: true },
      }),
      prisma.event.count(),
    ]);
    console.info(
      `[getEvents] Fetched ${events.length} events (total: ${total})`,
    );
    return { events, total };
  } catch (err: any) {
    console.error(`[getEvents] Error fetching events: ${err.message}`);
    throw err;
  }
}
