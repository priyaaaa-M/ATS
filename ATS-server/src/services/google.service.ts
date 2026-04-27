import { google } from 'googleapis'
import { config } from '../config'

export function createOAuth2Client(tokens?: {
  accessToken?: string | null
  refreshToken?: string | null
}) {
  const client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  )

  if (tokens?.accessToken || tokens?.refreshToken) {
    client.setCredentials({
      access_token: tokens.accessToken || undefined,
      refresh_token: tokens.refreshToken || undefined,
    })
  }

  return client
}

export const googleService = {
  getAuthUrl: (state?: string) => {
    const client = createOAuth2Client()
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: config.google.scopes,
      state,
    })
  },

  exchangeCode: async (code: string) => {
    const client = createOAuth2Client()
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const { data } = await oauth2.userinfo.get()

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      email: data.email || '',
      name: data.name || '',
      picture: data.picture,
    }
  },
}
