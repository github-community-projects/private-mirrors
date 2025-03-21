# Developing

## Prerequisites

- Node.js (LTS versions, 18 or higher with 22 preferred)
- npm (version 10 or higher)
- Docker (optional, for running the app in a container)

## Getting Started

1. Clone the repository:

   ```sh
   git clone https://github.com/github-community-projects/private-mirrors.git
   cd private-mirrors
   ```

2. Install the dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the root of the repository and add the necessary environment variables. Use the `.env.example` file as a reference.

4. Run the development server:

   ```sh
   npm run dev
   ```

   The app should now be running on `http://localhost:3000`.

## GitHub App

To use the app, you'll need to create a GitHub App and configure it to point to your local development environment.

1. Go to your Organization's profile, **Settings**, and select **GitHub Apps**.
2. Fill in the required fields:
   - **GitHub App name**: Private Mirrors App (or any name you prefer)
   - **Homepage URL**: `http://localhost:3000`
   - **Webhook URL**: `http://localhost:3000/api/webhooks`
   - **Webhook secret**: Generate a random secret and add it to your `.env` file as `WEBHOOK_SECRET`
3. Under **Repository permissions**, set the following permissions:
   - **Actions**: Read and write
   - **Administration**: Read and write
   - **Contents**: Read and write
   - **Custom Properties**: Read and write
   - **Workflows**: Read and write
4. Under **Organization permissions**, set the following permissions:
   - **Custom properties**: Admin
   - **Members**: Read and write
5. Under **Account permissions**, set the following permissions:

   - **Email addresses**: Read-only

6. Under **Subscribe to events**, select the following events:

   - **Installation target**
   - **Meta**
   - **Branch protection rule**
   - **Fork**
   - **Public**
   - **Push**
   - **Repository**
   - **Repository dispatch**
   - **Workflow dispatch**
   - **Workflow job**
   - **Workflow run**

7. Click **Create GitHub App**.
8. Generate a private key for the app and add it to your `.env` file as `PRIVATE_KEY`.
9. Note the **App ID** and **Client ID** and add them to your `.env` file as `APP_ID` and `GITHUB_CLIENT_ID`, respectively.
10. Generate a new **Client Secret** and add it to your `.env` file as `GITHUB_CLIENT_SECRET`.

## Running the App with Docker

If you prefer to run the app in a Docker container, follow these steps:

1. Pull the docker image from the GitHub Container Registry:

   ```sh
   docker pull ghcr.io/github-community-projects/private-mirrors:latest
   ```

   Or, if you prefer to make your own, build the Docker image:

   ```sh
   docker build -t private-mirrors .
   ```

2. Run the Docker container:

   ```sh
   docker run --env-file=.env -p 3000:3000 private-mirrors
   ```

   The app should now be running on `http://localhost:3000`.

## Testing

To run the tests, use the following command:

```sh
npm test
```

This will run the test suite and display the results in the terminal.

## Linting

To check for linting errors, use the following command:

```sh
npm run lint
```

This will run ESLint and display any linting errors in the terminal.

## Building

To build the app for production, use the following command:

```sh
npm run build
```

This will create an optimized production build of the app in the `out` directory.

## Deployment

To deploy the app, follow the instructions for your preferred hosting provider. The app can be deployed to any hosting provider that supports Next.js/Docker.
