"use server"

import { spawn } from 'node:child_process';

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
            console.error(`stderr: ${data}`);
        });

        ls.on('error', (error) => {
            reject(new Error(`Process error: ${error.message}`));
        });

        ls.on('close', (code) => {
            if (code !== 0) {
                const errorMessage = Buffer.concat(errorChunks).toString().trim();
                reject(new Error(`Process exited with code ${code}: ${errorMessage || 'Unknown error'}`));
                return;
            }

            try {
                const rawOutput = Buffer.concat(dataChunks).toString().trim();
                const jsonLines = rawOutput.split('\n').filter(line => line.trim() !== '');

                if (jsonLines.length === 0) {
                    resolve({ status: "success", containers: [], message: "No containers found" });
                    return;
                }

                const containers = jsonLines.map(line => JSON.parse(line));
                resolve({ status: "success", containers });
            } catch (err) {
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
            console.error(`stderr: ${data}`);
        });

        ls.on('error', (error) => {
            reject(new Error(`Process error: ${error.message}`));
        });

        ls.on('close', (code) => {
            if (code !== 0) {
                const errorMessage = Buffer.concat(errorChunks).toString().trim();
                reject(new Error(`Process exited with code ${code}: ${errorMessage || 'Unknown error'}`));
                return;
            }

            try {
                const rawOutput = Buffer.concat(dataChunks).toString().trim();
                resolve({ status: "success", output: rawOutput });
            } catch (err) {
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
            console.error(`stderr: ${data}`);
        });

        ls.on('error', (error) => {
            reject(new Error(`Process error: ${error.message}`));
        });

        ls.on('close', (code) => {
            if (code !== 0) {
                const errorMessage = Buffer.concat(errorChunks).toString().trim();
                reject(new Error(`Process exited with code ${code}: ${errorMessage || 'Unknown error'}`));
                return;
            }

            try {
                const rawOutput = Buffer.concat(dataChunks).toString().trim();
                resolve({ status: "success", output: rawOutput });
            } catch (err) {
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
            console.error(`stderr: ${data}`);
        });

        ls.on('error', (error) => {
            reject(new Error(`Process error: ${error.message}`));
        });

        ls.on('close', (code) => {
            if (code !== 0) {
                const errorMessage = Buffer.concat(errorChunks).toString().trim();
                reject(new Error(`Process failed with code ${code}: ${errorMessage || 'Unknown error'}`));
                return;
            }

            try {
                const output = Buffer.concat(dataChunks).toString().trim();
                const lines = output.split('\n');
                const resultPath = lines[lines.length - 1];

                if (lines[0] === "exists") {
                    resolve({ status: "success", path: resultPath, message: "Repository already existed, pulled latest changes" });
                } else {
                    resolve({ status: "success", path: resultPath, message: "Repository newly cloned" });
                }
            } catch (err) {
                reject(new Error(`Error processing output: ${(err as Error).message}`));
            }
        });
    });
}