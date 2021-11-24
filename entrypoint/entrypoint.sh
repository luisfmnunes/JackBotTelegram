#!/bin/bash

# Write to .env file
echo "BOT_TOKEN=<placeholder>

# This was inserted by `prisma init`:
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#using-environment-variables

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server (Preview) and MongoDB (Preview).
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL=\"postgresql://pguser:pguser@localhost:5432/jack_bot?schema=public\"" > ../.env

# Install dependencies
npm -i

# Run prisma migration
npx prisma migrate deploy

# Run the application
npx ts-node-dev ../src/index.ts