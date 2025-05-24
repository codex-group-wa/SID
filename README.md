# SID - Docker Deployment Manager

SID is a web-based application to help you manage your Docker container deployments with ease. It provides an interface to view, define, and manage your Docker stacks.

## Features

- View deployed Docker containers/stacks.
- Define and deploy new Docker stacks (using a form-based input).
- (Potentially) Monitor container status. (Planned or To be confirmed)
- (Potentially) Manage container actions (start, stop, restart - needs confirmation if implemented). (Planned or To be confirmed)

## Getting Started

### Prerequisites

- Docker: [Installation Guide](https://docs.docker.com/get-docker/)
- Node.js: [Installation Guide](https://nodejs.org/en/download/)
- Bun: [Installation Guide](https://bun.sh/docs/installation)

### Running with Docker (for end-users)

**Option 1: Using a pre-built image**

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
Example `docker run` command using a pre-built image:
```bash
docker run -d \
  -p 3000:3000 \
  -v ./sid-data:/app/data \
  -e PUID=$(id -u) \
  -e PGID=$(id -g) \
  --name sid-container \
  ghcr.io/declan-wade/sid:latest
```

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
    The project uses Prisma for ORM and SQLite as the database.
    To initialize/reset the database and apply migrations for development:
    ```bash
    npx prisma migrate dev
    ```
    This will create/update the `dev.db` file in the `prisma` directory.

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
- SQLite
- Docker
- Bun
- Tailwind CSS

## Contributing

Contributions are welcome! Please fork the repository, create a new branch for your feature or bug fix, and submit a pull request.

## License

This project is licensed under the [Apache-2.0 License](https://www.apache.org/licenses/LICENSE-2.0).
```
