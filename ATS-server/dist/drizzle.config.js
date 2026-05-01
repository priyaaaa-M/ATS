"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const connectionString = process.env.DATABASE_URL ||
    process.env.SUPABASE_POOLER_URL ||
    process.env.SUPABASE_DB_URL ||
    '';
exports.default = {
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    driver: 'pg',
    dbCredentials: {
        connectionString,
    },
};
