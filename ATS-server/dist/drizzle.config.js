"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
exports.default = {
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL || '',
    },
};
