# Repo Sync App

This project serves as a proof of concept for managing the synchronization of "private forks".

An initial ADR can be found [here](https://docs.google.com/document/d/1QXYzp_62fsVPWlAdzD2_OcwGonO3vvmO0lVw4DgGtIc/edit?usp=sharing).

## Getting Started Developing

### Install dependencies

```sh
npm i
```

### Create the GitHub App

_This part is not fun_

1. Create a new `.env` file from the `.env.example` file
2. Create a new GitHub App [here](https://github.com/settings/apps/new)
3. Copy all the secrets, credentials, and IDs into the `.env` file

### Select a smee.io channel

Go to [smee.io](https://smee.io/new) and create a new channel. Copy the URL and paste it into the `WEBHOOK_PROXY_URL` environment variable in `.env`.

### Start the application

```sh
npm run dev
```

## Setup

You'll need to install the GitHub app on whatever organization you plan on contributing from. You should give it access to all repositories.
