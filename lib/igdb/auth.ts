let cachedToken: string | null = null
let tokenExpiresAt: number = 0

export async function getIGDBToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken
  }

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  )

  if (!response.ok) {
    throw new Error(`IGDB auth failed: ${response.status}`)
  }

  const data = await response.json() as { access_token: string; expires_in: number }
  cachedToken = data.access_token
  // Refresh 1 day before expiry
  tokenExpiresAt = Date.now() + (data.expires_in - 86400) * 1000

  return cachedToken
}
