<img src=https://github.com/user-attachments/assets/81d5fd14-89d3-49c7-a01a-a99e54680bf8 width="100" height="100">

# SID - Docker Deployment Manager

SID is an opinionated, (almost) no-config service to provide a very simple way to have reliable GitOps for Docker Compose and GitHub.

This project has three key objectives:
1. Provide a highly reliable way of deploying changes to `docker-compose` files from GitHub
2. Provide clear visibility on the status of each attempted deployment - whether it failed or succeeded
3. It must be as simple as possible while still achieving the desired outcome

## Features

- With a correctly configured docker-compose file for SID, and a repo structured as per below - the service is ready to go, no further 
- Provides a listener for GitHub event webhooks with signature verification 
- Context-aware deployments - the service checks to see which `docker-compose` files changed in the webhook event and only redeploys the stacks that have changed. No need for different branches or tags. 
- Simple host validation out-of-the-box to provide basic security without needing an auth system
- A simple web interface to view activity logs, review stack status, container list and basic controls to start, stop and remove individual containers
- Basic database to capture and persist activity logs long-term
- The container includes `git`, so this does not need to be provided on the client

## Getting Started

### Prerequisites

- Docker and Docker Compose: [Installation Guide](https://docs.docker.com/get-docker/)
- A mono-repo on GitHub containing `docker-compose.yml` inside a folder at the repo root with the name of the stack. See example below:
```
my-compose-files/ <<--- this is the repo name
├── infrastructure/
│   └── docker-compose.yml
├── media/
│   └── docker-compose.yml
└── pi-hole/
    ├── docker-compose.yml
    └── config/
        └── conf.json
```
- If your repo is **private**, a PAT token is required as an environment variable - this is explained further below in the docker config.

> [!WARNING]
> Be **very careful** with your docker-compose files if your repo is public, as often there are sensitive environment variables such as secret keys.

### Running with Docker (for end-users)

**Option 1: Using a pre-built image (recomended)**

Official images are published to GitHub Container Registry (GHCR) whenever a new [release](https://github.com/declan-wade/SID/releases) is created.

You can pull the latest image using:
```bash
docker pull ghcr.io/declan-wade/sid:latest
```
Or a specific version (e.g., `1.0.0`):
```bash
docker pull ghcr.io/declan-wade/sid:1.0.0
```
Replace `1.0.0` with the desired version tag from the releases page.

Then, when running the container, use the pulled image name (e.g., `ghcr.io/declan-wade/sid:latest` or `ghcr.io/declan-wade/sid:1.0.0`) instead of `sid-app`.
Example `docker compose` command using a pre-built image:
```docker
services:
  app:
    image: ghcr.io/declan-wade/sid:latest
    ports:
      - "3000:3000"
    environment:
      - SID_ALLOWED_HOSTS=localhost:3000 ## Required: the host and port where the app is accessible
      - REPO_ROOT=https://<PAT>@github.com/<user>/<repo> ## Required: the URL of the repository root
      - REPO_NAME=compose-v2
      - DB_URL=postgresql://admin:password@db:5432/sid ## Required: the database URL
      - GITHUB_WEBHOOK_SECRET="abc" ## This is used to verify the GitHub webhook
    volumes:
      - ./sid/app/data:/app/data
      - /var/run/docker.sock:/var/run/docker.sock
  db:
    image: postgres
    restart: always
    volumes:
      - ./sid/app/db:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
      POSTGRES_DB: sid
```
Further information is available below on each config option.

**Option 2: Building the image locally**

1. Clone the repository:
   ```bash
   git clone https://github.com/declan-wade/SID.git
   cd SID
   ```
2. Build the Docker image:
   ```bash
   docker build -t sid-app .
   ```

**Running the container**

```bash
docker run -d \
  -p 3000:3000 \
  -v ./sid-data:/app/data \
  -e PUID=$(id -u) \
  -e PGID=$(id -g) \
  --name sid-container \
  sid-app
```

- **`-d`**: Run the container in detached mode.
- **`-p 3000:3000`**: Maps port 3000 on your host to port 3000 in the container. The default port is `3000` and can be changed via the `PORT` environment variable if necessary (e.g., `-e PORT=8080 -p 8080:8080`).
- **`-v ./sid-data:/app/data`**: Mounts a directory from your host to `/app/data` in the container for data persistence (e.g., the SQLite database). `<b>./sid-data</b>` is an example relative path that creates a `<b>sid-data</b>` directory in your current working directory. For production or more robust setups, consider using an absolute path (e.g., `<b>/opt/sid-data</b>`) or a Docker named volume.
- **`-e PUID=$(id -u)`**: Sets the user ID for the container process to your current user ID.
- **`-e PGID=$(id -g)`**: Sets the group ID for the container process to your current group ID.
- **`--name sid-container`**: Assigns a name to your container.
- **`sid-app`**: The name of the image you built.

Access the application by navigating to [http://localhost:3000](http://localhost:3000) (or your configured port) in your web browser.

### Development Instructions
> [!IMPORTANT]
> This repo will work with either `npm`, `pnpm` or `bun` for local development purposes, however the `Dockerfile` at build stage will be expecting a frozen `pnpm` lockfile, so ensure this has been updated with `pnpm install`

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/declan-wade/SID.git
    cd SID
    ```
2.  **Install dependencies:**
    This project uses [Bun](https://bun.sh/) as the package manager.
    ```bash
    bun install
    ```
3.  **Set up environment variables:**
    For development, `DATABASE_URL` is already configured in `prisma/schema.prisma` to use `file:./dev.db`.
    If you need to change it (e.g., to use a different database file or a server-based database), you can create a `.env` file in the root of the project and set the `DATABASE_URL` there:
    ```env
    DATABASE_URL="file:./dev.db"
    ```

4.  **Database setup:**
    The project uses Prisma for ORM and Postgres as the database.
    To initialize/reset the database and apply migrations for development:
    ```bash
    npx prisma migrate dev
    ```
    This will bootstrap a new database called `sid` with the permissions passed from the environment variables.

5.  **Run the development server:**
    ```bash
    bun dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

6.  **Running tests:**
    (Instructions for running tests - To be filled if tests are added)

## Tech Stack

- Next.js
- React
- TypeScript
- Prisma
- Postgres
- Docker
- Tailwind CSS

## Contributing

Contributions are welcome! Please fork the repository, create a new branch for your feature or bug fix, and submit a pull request.

## License

This project is licensed under the [MIT License](https://github.com/declan-wade/SID/tree/main?tab=MIT-1-ov-file).

