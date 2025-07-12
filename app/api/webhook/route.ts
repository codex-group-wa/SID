"use server";

import { clone, runDockerComposeForChangedDirs } from "@/lib/process";
import { Webhooks } from "@octokit/webhooks";
import crypto from 'crypto';

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET || "",
});

export async function POST(request: Request) {
  try {
    // Method 1: Using arrayBuffer and Buffer
    const rawBody = await request.arrayBuffer();
    const bodyBuffer = Buffer.from(rawBody);
    const body = bodyBuffer.toString('utf8');
    
    // Get the signature from headers
    const signature = request.headers.get("x-hub-signature-256");
    
    console.log("Webhook Secret exists:", !!process.env.GITHUB_WEBHOOK_SECRET);
    console.log("Signature received:", signature);
    console.log("Body length:", body.length);
    
    if (!signature) {
      return new Response("Missing signature", { status: 401 });
    }

    // Manual verification using crypto
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!)
      .update(bodyBuffer) // Use the buffer directly
      .digest('hex');
    
    console.log("Expected signature:", expectedSignature);
    console.log("Signatures match:", signature === expectedSignature);

    // Use crypto.timingSafeEqual for secure comparison
    const sigBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    
    const isValid = sigBuffer.length === expectedBuffer.length && 
                   crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!isValid) {
      console.log("Signature validation failed");
      return new Response("Invalid signature", { status: 401 });
    }

    console.log("Signature validation successful");

    // Parse the JSON payload after verification
    const payload = JSON.parse(body);
    
    // Clone the repository
    const response: any = await clone();

    // Process commits
    const changedFiles: string[] = [];
    const commits = payload.commits || [];
    
    console.log(`Processing ${commits.length} commits from the repository.`);
    
    commits.forEach((commit: any) => {
      console.log(`Commit: ${commit.id} - ${commit.message}`);
      
      // Process modified files
      if (commit.modified) {
        commit.modified.forEach((file: string) => {
          console.log(`Modified file: ${file}`);
          changedFiles.push(file);
        });
      }
      
      // Process added files
      if (commit.added) {
        commit.added.forEach((file: string) => {
          console.log(`Added file: ${file}`);
          changedFiles.push(file);
        });
      }
      
      // Process removed files (optional)
      if (commit.removed) {
        commit.removed.forEach((file: string) => {
          console.log(`Removed file: ${file}`);
          changedFiles.push(file);
        });
      }
    });
    
    console.log(`Changed files: ${changedFiles.join(', ')}`);
    
    // Run Docker Compose for changed directories
    if (changedFiles.length > 0) {
      await runDockerComposeForChangedDirs(changedFiles);
      console.log("Docker Compose run completed for changed directories.");
    } else {
      console.log("No files changed, skipping Docker Compose run.");
    }
    
    return new Response("Webhook processed successfully", { status: 200 });
    
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Internal server error", { status: 500 });
  }
}