"use server";

import { spawn } from "node:child_process";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { createEvent } from "./db";
import { revalidatePath } from "next/cache";

// Helper function for consistent error handling
function handleProcessError(
  functionName: string,
  id: string | null,
  error: Error,
  reject: (reason?: any) => void,
) {
  const message = `${functionName}${id ? `(${id})` : ""} process error: ${error.message}`;
  console.error(message);
  createEvent("Error", `Process error: ${error.message}`);
  reject(new Error(`Process error: ${error.message}`));
}

function handleProcessClose(
  functionName: string,
  id: string | null,
  code: number,
  errorChunks: Buffer[],
  reject: (reason?: any) => void,
): boolean {
  if (code !== 0) {
    const errorMessage = Buffer.concat(errorChunks).toString().trim();
    const message = `${functionName}${id ? `(${id})` : ""} process exited with code ${code}: ${errorMessage || "Unknown error"}`;
    console.error(message);
    createEvent(
      "Error",
      `Process exited with code ${code}: ${errorMessage || "Unknown error"}`,
    );
    reject(
      new Error(
        `Process exited with code ${code}: ${errorMessage || "Unknown error"}`,
      ),
    );
    return false;
  }
  return true;
}

function handleStderr(
  functionName: string,
  id: string | null,
  data: Buffer,
  operation: string,
) {
  console.error(`${functionName}${id ? `(${id})` : ""} stderr: ${data}`);
  createEvent("Error", `${operation} stderr: ${data}`);
}

export async function check() {
  return new Promise((resolve, reject) => {
    const ls = spawn("docker", [
      "container",
      "ls",
      "-a",
      "--format={{json .}}",
    ]);
    let dataChunks: Buffer[] = [];
    let errorChunks: Buffer[] = [];

    ls.stdout.on("data", (data) => {
      dataChunks.push(data);
    });

    ls.stderr.on("data", (data) => {
      errorChunks.push(data);
      handleStderr("check", null, data, "Check");
    });

    ls.on("error", (error) => {
      handleProcessError("check", null, error, reject);
    });

    ls.on("close", (code) => {
      if (!handleProcessClose("check", null, code ?? 1, errorChunks, reject)) {
        return;
      }

      try {
        const rawOutput = Buffer.concat(dataChunks).toString().trim();
        const jsonLines = rawOutput
          .split("\n")
          .filter((line) => line.trim() !== "");

        if (jsonLines.length === 0) {
          console.info("check() found no containers.");
          resolve({
            status: "success",
            containers: [],
            message: "No containers found",
          });
          return;
        }

        const containers = jsonLines.map((line) => JSON.parse(line));
        console.info(`check() found ${containers.length} containers.`);
        resolve({ status: "success", containers });
      } catch (err) {
        console.error(`check() error parsing JSON: ${(err as Error).message}`);
        createEvent("Error", `Error parsing JSON: ${(err as Error).message}`);
        if (process.env.NTFY_URL) {
          fetch(`${process.env.NTFY_URL}`, {
            method: "POST", // PUT works too
            body: "Error parsing JSON: ${(err as Error).message}",
            headers: {
              "X-Title": "SID 🐳 - Error",
            },
          });
        }
        reject(new Error(`Error parsing JSON: ${(err as Error).message}`));
      }
    });
  });
}

export async function stopContainer(id: string) {
  console.info(`Stopping container with ID: ${id}`);
  return new Promise((resolve, reject) => {
    const ls = spawn("docker", ["stop", id]);
    let dataChunks: Buffer[] = [];
    let errorChunks: Buffer[] = [];

    ls.stdout.on("data", (data) => {
      dataChunks.push(data);
    });

    ls.stderr.on("data", (data) => {
      errorChunks.push(data);
      handleStderr("stopContainer", id, data, "Stop");
    });

    ls.on("error", (error) => {
      handleProcessError("stopContainer", id, error, reject);
    });

    ls.on("close", (code) => {
      if (
        !handleProcessClose("stopContainer", id, code ?? 1, errorChunks, reject)
      ) {
        return;
      }

      try {
        const rawOutput = Buffer.concat(dataChunks).toString().trim();
        console.info(`stopContainer(${id}) success: ${rawOutput}`);
        createEvent("Success", `Container ${id} stopped successfully`);
        revalidatePath("/");
        resolve({ status: "success", output: rawOutput });
      } catch (err) {
        console.error(
          `stopContainer(${id}) error processing output: ${(err as Error).message}`,
        );
        createEvent(
          "Error",
          `Error processing output: ${(err as Error).message}`,
        );
        revalidatePath("/");
        reject(new Error(`Error processing output: ${(err as Error).message}`));
      }
    });
  });
}

export async function killContainer(id: string) {
  console.info(`Killing container with ID: ${id}`);
  return new Promise((resolve, reject) => {
    const ls = spawn("docker", ["kill", id]);
    let dataChunks: Buffer[] = [];
    let errorChunks: Buffer[] = [];

    ls.stdout.on("data", (data) => {
      dataChunks.push(data);
    });

    ls.stderr.on("data", (data) => {
      errorChunks.push(data);
      handleStderr("killContainer", id, data, "Kill");
    });

    ls.on("error", (error) => {
      handleProcessError("killContainer", id, error, reject);
    });

    ls.on("close", (code) => {
      if (
        !handleProcessClose("killContainer", id, code ?? 1, errorChunks, reject)
      ) {
        return;
      }

      try {
        const rawOutput = Buffer.concat(dataChunks).toString().trim();
        console.info(`killContainer(${id}) success: ${rawOutput}`);
        createEvent("Success", `Container ${id} killed successfully`);
        revalidatePath("/");
        resolve({ status: "success", output: rawOutput });
      } catch (err) {
        console.error(
          `killContainer(${id}) error processing output: ${(err as Error).message}`,
        );
        createEvent(
          "Error",
          `Error processing output: ${(err as Error).message}`,
        );
        revalidatePath("/");
        reject(new Error(`Error processing output: ${(err as Error).message}`));
      }
    });
  });
}

export async function deleteContainer(id: string) {
  console.info(`Deleting container with ID: ${id}`);
  return new Promise((resolve, reject) => {
    const ls = spawn("docker", ["container", "rm", "-v", id]);
    let dataChunks: Buffer[] = [];
    let errorChunks: Buffer[] = [];

    ls.stdout.on("data", (data) => {
      dataChunks.push(data);
    });

    ls.stderr.on("data", (data) => {
      errorChunks.push(data);
      handleStderr("deleteContainer", id, data, "Delete");
    });

    ls.on("error", (error) => {
      handleProcessError("deleteContainer", id, error, reject);
    });

    ls.on("close", (code) => {
      if (
        !handleProcessClose(
          "deleteContainer",
          id,
          code ?? 1,
          errorChunks,
          reject,
        )
      ) {
        return;
      }

      try {
        const rawOutput = Buffer.concat(dataChunks).toString().trim();
        console.info(`deleteContainer(${id}) success: ${rawOutput}`);
        createEvent("Success", `Container ${id} deleted successfully`);
        revalidatePath("/");
        resolve({ status: "success", output: rawOutput });
      } catch (err) {
        console.error(
          `deleteContainer(${id}) error processing output: ${(err as Error).message}`,
        );
        createEvent(
          "Error",
          `Error processing output: ${(err as Error).message}`,
        );
        revalidatePath("/");
        reject(new Error(`Error processing output: ${(err as Error).message}`));
      }
    });
  });
}

export async function restartContainer(id: string) {
  console.info(`Restarting container with ID: ${id}`);
  return new Promise((resolve, reject) => {
    const ls = spawn("docker", ["restart", id]);
    let dataChunks: Buffer[] = [];
    let errorChunks: Buffer[] = [];

    ls.stdout.on("data", (data) => {
      dataChunks.push(data);
    });

    ls.stderr.on("data", (data) => {
      errorChunks.push(data);
      handleStderr("restartContainer", id, data, "Restart");
    });

    ls.on("error", (error) => {
      handleProcessError("restartContainer", id, error, reject);
    });

    ls.on("close", (code) => {
      if (
        !handleProcessClose(
          "restartContainer",
          id,
          code ?? 1,
          errorChunks,
          reject,
        )
      ) {
        return;
      }

      try {
        const rawOutput = Buffer.concat(dataChunks).toString().trim();
        console.info(`restartContainer(${id}) success: ${rawOutput}`);
        createEvent("Success", `Container ${id} restarted successfully`);
        revalidatePath("/");
        resolve({ status: "success", output: rawOutput });
      } catch (err) {
        console.error(
          `restartContainer(${id}) error processing output: ${(err as Error).message}`,
        );
        createEvent(
          "Error",
          `Error processing output: ${(err as Error).message}`,
        );
        revalidatePath("/");
        reject(new Error(`Error processing output: ${(err as Error).message}`));
      }
    });
  });
}

export async function clone() {
  return new Promise((resolve, reject) => {
    const workingDir = process.env.WORKING_DIR || "/app/data";
    const repoRoot = process.env.REPO_URL;

    if (!repoRoot) {
      const errorMessage =
        "Required environment variable REPO_URL is not defined";
      console.error(`clone() ${errorMessage}`);
      createEvent("Error", "Missing REPO_URL environment variable");
      reject(new Error(errorMessage));
      return;
    }

    if (!process.env.WORKING_DIR) {
      console.warn(
        "No WORKING_DIR environment variable. Using default path `/app/data/` -- ensure this path is mounted!",
      );
      createEvent(
        "Info",
        "No WORKING_DIR environment variable. Using default path `/app/data/` -- ensure this path is mounted!",
      );
    }

    const repoName = process.env.REPO_NAME;
    const repoPath = `${workingDir}/${repoName}`;

    // Detect SSH or HTTPS/PAT repo URL
    const isSSH = repoRoot.startsWith("git@");
    const isPAT = repoRoot.startsWith("https://");

    // If using SSH, set GIT_SSH_COMMAND to avoid host key prompt (optional)
    // You may want to customize this for your environment
    const env = { ...process.env };
    if (isSSH) {
      env.GIT_SSH_COMMAND = "ssh -o StrictHostKeyChecking=accept-new";
    }

    const checkDirCmd = `if [ -d "${repoPath}" ]; then
                              echo "exists";
                              cd "${repoPath}" && git fetch --all && git pull && echo "${repoPath}";
                            else
                              echo "new";
                              cd "${workingDir}" && git clone "${repoRoot}" && echo "${repoPath}";
                            fi`;

    const ls = spawn("sh", ["-c", checkDirCmd], { env });
    let dataChunks: Buffer[] = [];
    let errorChunks: Buffer[] = [];

    ls.stdout.on("data", (data) => {
      dataChunks.push(data);
    });

    ls.stderr.on("data", (data) => {
      errorChunks.push(data);
      const stderrText = data.toString().trim();

      // Check if this is actually an error or just git info
      const isActualError =
        stderrText.includes("fatal:") ||
        stderrText.includes("error:") ||
        stderrText.includes("permission denied");

      if (isActualError) {
        console.error(`clone() stderr: ${data}`);
        createEvent("Error", `Clone stderr: ${data}`);
        if (process.env.NTFY_URL) {
          fetch(`${process.env.NTFY_URL}`, {
            method: "POST", // PUT works too
            body: `Clone stderr: ${data}`,
            headers: {
              "X-Title": "SID 🐳 - Error Cloning",
            },
          });
        }
      } else {
        console.info(`clone() git info: ${data}`);
      }
    });

    ls.on("error", (error) => {
      handleProcessError("clone", null, error, reject);
    });

    ls.on("close", (code) => {
      if (!handleProcessClose("clone", null, code ?? 1, errorChunks, reject)) {
        return;
      }

      try {
        const output = Buffer.concat(dataChunks).toString().trim();
        const lines = output.split("\n");
        const resultPath = lines[lines.length - 1];

        if (lines[0] === "exists") {
          console.info(
            `clone() repository already exists at ${resultPath}, pulled latest changes.`,
          );
          createEvent(
            "Info",
            `Repository already exists, pulled latest changes at ${resultPath}`,
          );
          revalidatePath("/");
          resolve({
            status: "success",
            path: resultPath,
            message: "Repository already exists, pulled latest changes",
          });
        } else {
          console.info(`clone() repository newly cloned to ${resultPath}.`);
          createEvent("Info", `Repository newly cloned to ${resultPath}`);
          if (process.env.NTFY_URL) {
            fetch(`${process.env.NTFY_URL}`, {
              method: "POST", // PUT works too
              body: `Repository newly cloned to ${resultPath}`,
              headers: {
                "X-Title": "SID 🐳 - Success",
              },
            });
          }
          revalidatePath("/");
          resolve({
            status: "success",
            path: resultPath,
            message: "Repository newly cloned",
          });
        }
      } catch (err) {
        console.error(
          `clone() error processing output: ${(err as Error).message}`,
        );
        createEvent(
          "Error",
          `Error processing output: ${(err as Error).message}`,
        );
        revalidatePath("/");
        reject(new Error(`Error processing output: ${(err as Error).message}`));
      }
    });
  });
}

export async function runDockerComposeForChangedDirs(
  files: string[],
): Promise<{ dir: string; result: string; error?: string }[]> {
  let workingDir = process.env.WORKING_DIR || "/app/data";

  if (!workingDir) {
    console.warn(
      "No WORKING_DIR environment variable. Using default path `/app/data/` -- ensure this path is mounted!",
    );
  }

  if (!process.env.REPO_URL) {
    throw new Error("Required environment variable REPO_URL is not set");
  }

  const repoName = process.env.REPO_URL?.split("/").pop()?.replace(".git", "");
  workingDir = `${workingDir}/${repoName}`;

  // Get unique directories from file paths
  const dirs = Array.from(
    new Set(
      files.map((f) => f.split("/").slice(0, -1).join("/")).filter(Boolean),
    ),
  );

  const results: { dir: string; result: string; error?: string }[] = [];

  for (const dir of dirs) {
    const absDir = `${workingDir}/${dir}`;
    console.info(`Running docker compose in: ${absDir}`);

    try {
      const result = await new Promise<string>((resolve, reject) => {
        const proc = spawn(
          "docker",
          ["compose", "up", "-d", "--remove-orphans"],
          { cwd: absDir },
        );
        let output = "";
        let errorOutput = "";

        proc.stdout.on("data", (data) => {
          output += data.toString();
        });

        proc.stderr.on("data", (data) => {
          errorOutput += data.toString();
        });

        proc.on("error", (error) => {
          const message = `Failed to start docker compose in ${absDir}: ${error.message}`;
          console.error(message);
          createEvent("Error", message, dir.split("/")[0]);
          if (process.env.NTFY_URL) {
            fetch(`${process.env.NTFY_URL}`, {
              method: "POST", // PUT works too
              body: `Error: {message}`,
              headers: {
                "X-Title": "SID 🐳 - Failed to start docker compose",
              },
            });
          }
          reject(error);
        });

        proc.on("close", (code) => {
          if (code === 0) {
            console.info(
              `docker compose up succeeded in ${absDir}: ${output.trim()}`,
            );
            createEvent(
              "Success",
              `docker compose up succeeded in ${absDir}`,
              dir.split("/")[0],
            );
            if (process.env.NTFY_URL) {
              fetch(`${process.env.NTFY_URL}`, {
                method: "POST", // PUT works too
                body: `docker compose up succeeded in ${absDir}`,
                headers: {
                  "X-Title": "SID 🐳 - Success",
                },
              });
            }
            resolve(output.trim());
          } else {
            const errorMessage =
              errorOutput.trim() || `Exited with code ${code}`;
            console.error(
              `docker compose up failed in ${absDir}: ${errorMessage}`,
            );
            createEvent(
              "Error",
              `docker compose up failed in ${absDir}: ${errorMessage}`,
              dir.split("/")[0],
            );
            if (process.env.NTFY_URL) {
              fetch(`${process.env.NTFY_URL}`, {
                method: "POST", // PUT works too
                body: `docker compose up failed in ${absDir}: ${errorMessage}`,
                headers: {
                  "X-Title": "SID 🐳 - Failed to start docker compose",
                },
              });
            }
            reject(new Error(errorMessage));
          }
        });
      });

      results.push({ dir: absDir, result });
    } catch (err: any) {
      console.error(
        `Error running docker compose in ${absDir}: ${err.message}`,
      );
      createEvent(
        "Error",
        `Error running docker compose in ${absDir}: ${err.message}`,
        dir.split("/")[0],
      );
      results.push({ dir: absDir, result: "", error: err.message });
    }
  }

  return results;
}

export async function findAllDockerComposeFiles(): Promise<string[]> {
  const workingDir = process.env.WORKING_DIR || "/app/data";
  const repoRoot = process.env.REPO_URL;

  if (!repoRoot) {
    throw new Error("Required environment variable REPO_URL is not set");
  }

  const repoName = repoRoot.split("/").pop()?.replace(".git", "");
  if (!repoName) {
    throw new Error("Unable to determine repository name from REPO_URL");
  }

  if (!process.env.WORKING_DIR) {
    console.warn(
      "No WORKING_DIR environment variable. Using default path `/app/data/` -- ensure this path is mounted!",
    );
  }

  const rootDir = join(workingDir, repoName);
  const results: string[] = [];

  function walk(dir: string) {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch (err) {
      console.error(
        `Error reading directory ${dir}: ${(err as Error).message}`,
      );
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      let stats;

      try {
        stats = statSync(fullPath);
      } catch (err) {
        console.error(
          `Error stating path ${fullPath}: ${(err as Error).message}`,
        );
        continue;
      }

      if (stats.isDirectory()) {
        walk(fullPath);
      } else if (
        entry === "docker-compose.yml" ||
        entry === "docker-compose.yaml"
      ) {
        results.push(fullPath);
      }
    }
  }

  walk(rootDir);
  return results;
}

export async function runDockerComposeForPath(
  path: string,
): Promise<{ dir: string; result: string; error?: string }> {
  const workingDir = process.env.WORKING_DIR;

  if (!workingDir) {
    throw new Error("WORKING_DIR environment variable is not set");
  }

  // Remove leading/trailing slashes and construct absolute directory path
  const cleanPath = path.replace(/^\/|\/$/g, "");
  const absDir = `${workingDir}/${cleanPath}`;
  console.log("stack name: ", cleanPath.split("/")[1]);
  console.info(`Running docker compose in: ${absDir}`);

  try {
    const result = await new Promise<string>((resolve, reject) => {
      const proc = spawn(
        "docker",
        ["compose", "up", "-d", "--remove-orphans"],
        { cwd: absDir },
      );
      let output = "";
      let errorOutput = "";

      proc.stdout.on("data", (data) => {
        output += data.toString();
      });

      proc.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      proc.on("error", (error) => {
        const message = `Failed to start docker compose in ${absDir}: ${error.message}`;
        console.error(message);
        createEvent("Error", message, cleanPath.split("/")[1]);
        revalidatePath("/");
        reject(error);
      });

      proc.on("close", (code) => {
        if (code === 0) {
          console.info(
            `docker compose up succeeded in ${absDir}: ${output.trim()}`,
          );
          createEvent(
            "Success",
            `docker compose up succeeded in ${absDir}`,
            cleanPath.split("/")[1],
          );
          revalidatePath("/");
          resolve(output.trim());
        } else {
          const errorMessage = errorOutput.trim() || `Exited with code ${code}`;
          console.error(
            `docker compose up failed in ${absDir}: ${errorMessage}`,
          );
          createEvent(
            "Error",
            `docker compose up failed in ${absDir}: ${errorMessage}`,
            cleanPath.split("/")[1],
          );
          revalidatePath("/");
          reject(new Error(errorMessage));
        }
      });
    });

    return { dir: absDir, result };
  } catch (err: any) {
    console.error(`Error running docker compose in ${absDir}: ${err.message}`);
    createEvent(
      "Error",
      `Error running docker compose in ${absDir}: ${err.message}`,
      cleanPath.split("/")[1],
    );
    revalidatePath("/");
    return { dir: absDir, result: "", error: err.message };
  }
}
