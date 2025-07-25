<img src=https://github.com/user-attachments/assets/81d5fd14-89d3-49c7-a01a-a99e54680bf8 width="100" height="100">

# SID - Simple Integration & Deployment

SID is an opinionated, (almost) no-config service to provide a very simple way to have reliable GitOps for Docker Compose and GitHub.

This project has three key objectives:
1. Provide a highly reliable way of deploying changes to `docker-compose` files from GitHub
2. Provide clear visibility on the status of each attempted deployment - whether it failed or succeeded
3. It must be as simple as possible while still achieving the desired outcome

### Why not Portainer or Komodo?
These apps are excellent and far more powerful than SID - however they are significantly more complicated to setup. Generally they require configuring each stack individually along with the webhook. They also have differing ability to elegantly handle mono-repo setups.
The interface of both these apps (particularly Komodo) can also be overwhelming for new users.

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
      - SID_ALLOWED_HOSTS=localhost:3000
      - REPO_ROOT=https://<PAT>@github.com/<user>/<repo> 
      - REPO_NAME=compose-v2
      - WORKING_DIR=/home/user/sid/data
      - DB_URL=postgresql://admin:password@db:5432/sid
      - GITHUB_WEBHOOK_SECRET="abc"
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

## Configuration

| Name                  | Required?         | Description                                                                                                                                                                                                                                                    | Example                                                              |
|-----------------------|-------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| SID_ALLOWED_HOSTS     | Yes               | This is the host and port SID is running on, that you want to externally access the Web UI on. This does not affect the webhook listener If you are only accessing the Web UI on localhost, this can be assigned `localhost:3000`                                | `10.1.1.10:3000`                                                       |
| REPO_ROOT             | Yes               | The URL to your repo. NOTE: If your repo is private, you **must** provide a Personal Access Token (PAT) in this format: `https://<PAT>@github.com/<user>/<repo>`                                                                                                     | `https://github_pat_11AEXXXXX@github.com/john-smith/my-docker-compose` |
| REPO_NAME             | Yes               | This is the name of your repository, without the organisation or username                                                                                                                                                                                      | my-docker-compose                                                    |
| WORKING_DIR           | See description   | This is required if the mounts in your docker-compose files are using a relative path (e.g. `./portainer/data:/data`),  but this does not matter if your using a full path to your mounts (e.g. `/home/user/portainer/data:/data`).                            |                                                                      |
| DB_URL                | Yes               | For connecting to the postgres container. The default is fine, however you can change it if you know what your doing                                                                                                                                           | `postgresql://admin:password@db:5432/sid`                              |
| GITHUB_WEBHOOK_SECRET | If using webhooks | If your using a webhook to trigger deployments (recommended) then you must provide a secret that matches the secret provided when configuring a webhook in GitHub. GitHub does allow creation of webhooks without a secret however this will fail validation.  | `abczyx`                                                               |

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

