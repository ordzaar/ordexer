# Ordexer

Your next level hyper ordinals indexer

## Setup

This project is setup with [pnpm workspaces](https://pnpm.io/workspaces) and [turbo](https://turbo.build/). It follows a monorepo architecture for all its applications.

In this workspace, you can refer to [pnpm-workspace.yaml](pnpm-workspace.yaml) on how the project is structured.

```txt
apps/
├─ db/
├─ indexer/
|- api/
```

### Developing & Contributing

Thanks for contributing, appreciate all the help we can get. Feel free to make a pull-request, we will guide you along
the way to make it mergeable.

### Prerequisites

You'll need to have `pnpm` installed on your system. If it's not yet installed, you can get it via npm using:

```bash
npm install -g pnpm
pnpm i
```

Will need to have docker running as well to run the database.

### Tech Stack

#### Database

The database is running on Postgres 16.x and Prisma. To run it, use `pnpm start` with docker open. 
