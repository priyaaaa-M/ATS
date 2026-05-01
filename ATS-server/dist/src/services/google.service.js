"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleService = void 0;
exports.createOAuth2Client = createOAuth2Client;
const googleapis_1 = require("googleapis");
const config_1 = require("../config");
function createOAuth2Client(tokens) {
    const client = new googleapis_1.google.auth.OAuth2(config_1.config.google.clientId, config_1.config.google.clientSecret, config_1.config.google.redirectUri);
    if (tokens?.accessToken || tokens?.refreshToken) {
        client.setCredentials({
            access_token: tokens.accessToken || undefined,
            refresh_token: tokens.refreshToken || undefined,
        });
    }
    return client;
}
exports.googleService = {
    getAuthUrl: (state) => {
        const client = createOAuth2Client();
        return client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: [...config_1.config.google.scopes],
            state,
        });
    },
    exchangeCode: async (code) => {
        const client = createOAuth2Client();
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);
        const oauth2 = googleapis_1.google.oauth2({ version: 'v2', auth: client });
        const { data } = await oauth2.userinfo.get();
        return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            email: data.email || '',
            name: data.name || '',
            picture: data.picture,
        };
    },
};
