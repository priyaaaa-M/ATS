"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./src/app");
const config_1 = require("./src/config");
const transcript_job_1 = require("./src/jobs/transcript.job");
const app = (0, app_1.createApp)();
app.listen(config_1.config.port, () => {
    console.log(`Server running on port ${config_1.config.port}`);
    console.log(`Environment: ${config_1.config.nodeEnv}`);
    console.log(`App URL: ${config_1.config.appBaseUrl}`);
    (0, transcript_job_1.startTranscriptJob)();
});
