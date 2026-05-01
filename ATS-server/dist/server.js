"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./src/app");
const config_1 = require("./src/config");
const transcript_job_1 = require("./src/jobs/transcript.job");
const app = (0, app_1.createApp)();
const dbUrl = new URL(config_1.config.supabase.dbUrl);
app.listen(config_1.config.port, () => {
    console.log(`Server running on port ${config_1.config.port}`);
    console.log(`Environment: ${config_1.config.nodeEnv}`);
    console.log(`App URL: ${config_1.config.appBaseUrl}`);
    console.log(`DB Host: ${dbUrl.hostname}:${dbUrl.port || '5432'}`);
    (0, transcript_job_1.startTranscriptJob)();
});
