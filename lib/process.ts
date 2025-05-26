"use server"

import { spawn } from 'node:child_process';
import { revalidatePath } from 'next/cache';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { createEvent } from './db';

export async function check() {
    return new Promise((resolve, reject) => {
        const ls = spawn('docker', ['container', 'ls', '-a', '--format={{json .}}']);
        let dataChunks: Buffer[] = [];
        let errorChunks: Buffer[] = [];

        ls.stdout.on('data', (data) => {
            dataChunks.push(data);
        });

        ls.stderr.on('data', (data) => {
            errorChunks.push(data);
            console.error(`check() stderr: ${data}`);
            createEvent('Error', `Check stderr: ${data}`);
        });

        ls.on('error', (error) => {
            console.error(`check() process error: ${error.message}`);
            createEvent('Error', `Process error: ${error.message}`);
            reject(new Error(`Process error: ${error.message}`));
        });

        ls.on('close', (code) => {
            if (code !== 0) {
                const errorMessage = Buffer.concat(errorChunks).toString().trim();
                console.error(`check() process exited with code ${code}: ${errorMessage || 'Unknown error'}`);
                createEvent('Error', `Process exited with code ${code}: ${errorMessage || 'Unknown error'}`);
                reject(new Error(`Process exited with code ${code}: ${errorMessage || 'Unknown error'}`));
                return;
            }

            try {
                const rawOutput = Buffer.concat(dataChunks).toString().trim();
                const jsonLines = rawOutput.split('\n').filter(line => line.trim() !== '');

                if (jsonLines.length === 0) {
                    console.info("check() found no containers.");
                    resolve({ status: "success", containers: [], message: "No containers found" });
                    return;
                }

                const containers = jsonLines.map(line => JSON.parse(line));
                console.info(`check() found ${containers.length} containers.`);
                resolve({ status: "success", containers });
            } catch (err) {
                console.error(`check() error parsing JSON: ${(err as Error).message}`);
                createEvent('Error', `Error parsing JSON: ${(err as Error).message}`);
                reject(new Error(`Error parsing JSON: ${(err as Error).message}`));
            }
        });
    });
}

export async function stopContainer(id: string) {
    return new Promise((resolve, reject) => {
        const ls = spawn('docker', ['stop', id]);
        let dataChunks: Buffer[] = [];
        let errorChunks: Buffer[] = [];

        ls.stdout.on('data', (data) => {
            dataChunks.push(data);
        });

        ls.stderr.on('data', (data) => {
            errorChunks.push(data);
            console.error(`stopContainer(${id}) stderr: ${data}`);
            createEvent('Error', `Stop stderr: ${data}`);
        });

        ls.on('error', (error) => {
            console.error(`stopContainer(${id}) process error: ${error.message}`);
            createEvent('Error', `Process error: ${error.message}`);
            reject(new Error(`Process error: ${error.message}`));
        });

        ls.on('close', (code) => {
            if (code !== 0) {
                const errorMessage = Buffer.concat(errorChunks).toString().trim();
                console.error(`stopContainer(${id}) process exited with code ${code}: ${errorMessage || 'Unknown error'}`);
                createEvent('Error', `Process exited with code ${code}: ${errorMessage || 'Unknown error'}`);
                reject(new Error(`Process exited with code ${code}: ${errorMessage || 'Unknown error'}`));
                return;
            }

            try {
                const rawOutput = Buffer.concat(dataChunks).toString().trim();
                console.info(`stopContainer(${id}) success: ${rawOutput}`);
                createEvent('Success', `Container ${id} stopped successfully`);
                revalidatePath('/');
                resolve({ status: "success", output: rawOutput });
            } catch (err) {
                console.error(`stopContainer(${id}) error processing output: ${(err as Error).message}`);
                createEvent('Error', `Error processing output: ${(err as Error).message}`);
                reject(new Error(`Error processing output: ${(err as Error).message}`));
            }
        });
    });
}

export async function restartContainer(id: string) {
    return new Promise((resolve, reject) => {
        const ls = spawn('docker', ['restart', id]);
        let dataChunks: Buffer[] = [];
        let errorChunks: Buffer[] = [];

        ls.stdout.on('data', (data) => {
            dataChunks.push(data);
        });

        ls.stderr.on('data', (data) => {
            errorChunks.push(data);
            console.error(`restartContainer(${id}) stderr: ${data}`);
            createEvent('Error', `Restart stderr: ${data}`);
        });

        ls.on('error', (error) => {
            console.error(`restartContainer(${id}) process error: ${error.message}`);
            createEvent('Error', `Process error: ${error.message}`);
            reject(new Error(`Process error: ${error.message}`));
        });

        ls.on('close', (code) => {
            if (code !== 0) {
                const errorMessage = Buffer.concat(errorChunks).toString().trim();
                console.error(`restartContainer(${id}) process exited with code ${code}: ${errorMessage || 'Unknown error'}`);
                createEvent('Error', `Process exited with code ${code}: ${errorMessage || 'Unknown error'}`);
                reject(new Error(`Process exited with code ${code}: ${errorMessage || 'Unknown error'}`));
                return;
            }

            try {
                const rawOutput = Buffer.concat(dataChunks).toString().trim();
                console.info(`restartContainer(${id}) success: ${rawOutput}`);
                createEvent('Success', `Container ${id} restarted successfully`);
                revalidatePath('/');
                resolve({ status: "success", output: rawOutput });
            } catch (err) {
                console.error(`restartContainer(${id}) error processing output: ${(err as Error).message}`);
                createEvent('Error', `Error processing output: ${(err as Error).message}`);
                reject(new Error(`Error processing output: ${(err as Error).message}`));
            }
        });
    });
}

export async function clone() {
    return new Promise((resolve, reject) => {
        const workingDir = process.env.WORKING_DIR;
        const repoRoot = process.env.REPO_ROOT;

        if (!workingDir || !repoRoot) {
            console.error("clone() missing WORKING_DIR or REPO_ROOT environment variables.");
            createEvent('Error', 'Missing WORKING_DIR or REPO_ROOT environment variables');
            reject(new Error("Required environment variables WORKING_DIR or REPO_ROOT are not defined"));
            return;
        }

        const repoName = repoRoot.split('/').pop()?.replace('.git', '');
        const repoPath = `${workingDir}/${repoName}`;

        const checkDirCmd = `if [ -d "${repoPath}" ]; then 
                              echo "exists"; 
                              cd "${repoPath}" && git fetch --all && git pull && echo "${repoPath}";
                            else 
                              echo "new"; 
                              cd "${workingDir}" && git clone "${repoRoot}" && echo "${repoPath}";
                            fi`;

        const ls = spawn('bash', ['-c', checkDirCmd]);

        let dataChunks: Buffer[] = [];
        let errorChunks: Buffer[] = [];

        ls.stdout.on('data', (data) => {
            dataChunks.push(data);
        });

        ls.stderr.on('data', (data) => {
            errorChunks.push(data);
            console.error(`clone() stderr: ${data}`);
            createEvent('Error', `Clone stderr: ${data}`);
        });

        ls.on('error', (error) => {
            console.error(`clone() process error: ${error.message}`);
            createEvent('Error', `Process error: ${error.message}`);
            reject(new Error(`Process error: ${error.message}`));
        });

        ls.on('close', (code) => {
            if (code !== 0) {
                const errorMessage = Buffer.concat(errorChunks).toString().trim();
                console.error(`clone() process failed with code ${code}: ${errorMessage || 'Unknown error'}`);
                createEvent('Error', `Process failed with code ${code}: ${errorMessage || 'Unknown error'}`);
                reject(new Error(`Process failed with code ${code}: ${errorMessage || 'Unknown error'}`));
                return;
            }

            try {
                const output = Buffer.concat(dataChunks).toString().trim();
                const lines = output.split('\n');
                const resultPath = lines[lines.length - 1];

                if (lines[0] === "exists") {
                    console.info(`clone() repository already exists at ${resultPath}, pulled latest changes.`);
                    createEvent('Info', `Repository already exists, pulled latest changes at ${resultPath}`);
                    revalidatePath('/');
                    resolve({ status: "success", path: resultPath, message: "Repository already exists, pulled latest changes" });
                } else {
                    console.info(`clone() repository newly cloned to ${resultPath}.`);
                    createEvent('Info', `Repository newly cloned to ${resultPath}`);
                    revalidatePath('/');
                    resolve({ status: "success", path: resultPath, message: "Repository newly cloned" });
                }
            } catch (err) {
                console.error(`clone() error processing output: ${(err as Error).message}`);
                createEvent('Error', `Error processing output: ${(err as Error).message}`);
                reject(new Error(`Error processing output: ${(err as Error).message}`));
            }
        });
    });
}

export async function runDockerComposeForChangedDirs(files: string[]): Promise<{dir: string, result: string, error?: string}[]> {
    let workingDir = process.env.WORKING_DIR;
    if (!workingDir) {
        throw new Error("WORKING_DIR environment variable is not set");
    }
    const repoName = process.env.REPO_ROOT?.split('/').pop()?.replace('.git', '');
    workingDir = `${workingDir}/${repoName}`;
    // Get unique directories from file paths
    const dirs = Array.from(new Set(
        files
            .map(f => f.split('/').slice(0, -1).join('/'))
            .filter(Boolean)
    ));

    const results: {dir: string, result: string, error?: string}[] = [];
    let allSuccessful = true;

    for (const dir of dirs) {
        const absDir = `${workingDir}/${dir}`;
        console.info(`Running docker compose in: ${absDir}`);
        try {
            const result = await new Promise<string>((resolve, reject) => {
                const proc = spawn('docker', ['compose', 'up', '-d', '--remove-orphans'], { cwd: absDir });
                let output = '';
                let error = '';

                proc.stdout.on('data', (data) => {
                    output += data.toString();
                });
                proc.stderr.on('data', (data) => {
                    error += data.toString();
                });
                proc.on('close', (code) => {
                    if (code === 0) {
                        console.info(`docker compose up succeeded in ${absDir}: ${output.trim()}`);
                        createEvent('Success', `docker compose up succeeded in ${absDir}`, dir.split('/')[0]);
                        resolve(output.trim());
                    } else {
                        console.error(`docker compose up failed in ${absDir}: ${error.trim()}`);
                        createEvent('Error', `docker compose up failed in ${absDir}: ${error.trim()}`, dir.split('/')[0]);
                        allSuccessful = false; // Mark as not all successful
                        reject(new Error(error.trim() || `Exited with code ${code}`));
                    }
                });
                proc.on('error', (err) => {
                    console.error(`Failed to start docker compose in ${absDir}: ${err.message}`);
                    createEvent('Error', `Failed to start docker compose in ${absDir}: ${err.message}`, dir.split('/')[0]);
                    allSuccessful = false; // Mark as not all successful
                    reject(err);
                });
            });
            results.push({ dir: absDir, result });
        } catch (err: any) {
            console.error(`Error running docker compose in ${absDir}: ${err.message}`);
            createEvent('Error', `Error running docker compose in ${absDir}: ${err.message}`, dir.split('/')[0]);
            results.push({ dir: absDir, result: '', error: err.message });
            allSuccessful = false; // Mark as not all successful
        }
    }

    if (allSuccessful && dirs.length > 0) {
        revalidatePath('/');
    }
    return results;
}

export async function findAllDockerComposeFiles(): Promise<string[]> {
    let workingDir = process.env.WORKING_DIR;
    const repoName = process.env.REPO_ROOT?.split('/').pop()?.replace('.git', '');
    if (!workingDir || !repoName) {
        throw new Error("WORKING_DIR or REPO_ROOT environment variable is not set");
    }
    const rootDir = join(workingDir, repoName);

    const results: string[] = [];

    function walk(dir: string) {
        let entries: string[];
        try {
            entries = readdirSync(dir);
        } catch (err) {
            console.error(`Error reading directory ${dir}: ${(err as Error).message}`);
            return;
        }
        for (const entry of entries) {
            const fullPath = join(dir, entry);
            let stats;
            try {
                stats = statSync(fullPath);
            } catch (err) {
                console.error(`Error stating path ${fullPath}: ${(err as Error).message}`);
                continue;
            }
            if (stats.isDirectory()) {
                walk(fullPath);
            } else if (
                entry === 'docker-compose.yml' ||
                entry === 'docker-compose.yaml'
            ) {
                results.push(fullPath);
            }
        }
    }

    walk(rootDir);
    return results;
}