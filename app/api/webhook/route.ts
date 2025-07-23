"use server";

import { clone, runDockerComposeForChangedDirs } from "@/lib/process";
import { Webhooks } from "@octokit/webhooks";

const webhooks = new Webhooks({
  secret: "abc",
});

export async function POST(request: Request) {
  try {
    // Method 1: Using arrayBuffer and Buffer
    //   const rawBody = await request.arrayBuffer();
    //   const bodyBuffer = Buffer.from(rawBody);
    const body = await request.text();
    // console.log(body);

    // Get the signature from headers
    const signature = request.headers.get("x-hub-signature-256");
    console.log(signature);

    if (!signature) {
      return new Response("Missing signature", { status: 401 });
    }

    const isValid = await webhooks.verify(body, signature);
    console.info("###");
    console.info(isValid);
    console.info("###");

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

    console.log(`Changed files: ${changedFiles.join(", ")}`);

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
