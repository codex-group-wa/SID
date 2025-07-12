"use server";

import { clone, runDockerComposeForChangedDirs } from "@/lib/process";
import crypto from "crypto";

export async function POST(request: Request) {
  const rawBody = await request.arrayBuffer();
  const bodyBuffer = Buffer.from(rawBody);
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Get signature headers
  const sig256 = request.headers.get("x-hub-signature-256");
  const sig1 = request.headers.get("x-hub-signature");

  // Compute HMAC digests
  const hmac256 = crypto.createHmac("sha256", secret).update(bodyBuffer).digest("hex");
  const hmac1 = crypto.createHmac("sha1", secret).update(bodyBuffer).digest("hex");

  console.log(hmac256, hmac1);
  
  // Validate signatures
  let valid = false;
  if (sig256 && sig256.startsWith("sha256=")) {
    const sigBuf = Buffer.from(sig256.slice(7), "hex");
    const hmacBuf = Buffer.from(hmac256, "hex");
    if (sigBuf.length === hmacBuf.length && crypto.timingSafeEqual(sigBuf, hmacBuf)) {
      valid = true;
    }
  }
  if (!valid && sig1 && sig1.startsWith("sha1=")) {
    const sigBuf = Buffer.from(sig1.slice(5), "hex");
    const hmacBuf = Buffer.from(hmac1, "hex");
    if (sigBuf.length === hmacBuf.length && crypto.timingSafeEqual(sigBuf, hmacBuf)) {
      valid = true;
    }
  }

  if (!valid) {
    console.error("Invalid webhook signature");
    return new Response("Invalid signature", { status: 401 });
  }

  // Parse JSON body after validation
  const body = JSON.parse(bodyBuffer.toString());
  //console.log(body);

  const response: any = await clone();
  console.log(response);
  const payload: any = [];
  const commits = body.commits;
  console.log(`Cloned ${commits.length} commits from the repository.`);
  commits.forEach((commit: any) => {
    console.log(`Commit: ${commit.id} - ${commit.message}`);
    console.log(commit.modified, commit.added);
    commit.modified.forEach((file: string) => {
      console.log(`Modified file: ${file}`);
      payload.push(file);
    });
    commit.added.forEach((file: string) => {
      console.log(`Added file: ${file}`);
      payload.push(file);
    });
  });
  console.log(`Payload: ${payload}`);
  runDockerComposeForChangedDirs(payload);
  console.log("Docker Compose run completed for changed directories.");
  return new Response("Done", { status: 200 });
}
