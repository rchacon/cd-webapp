const domain = import.meta.env.VITE_COGNITO_DOMAIN
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID

const redirectUri = `${window.location.origin}/callback`
const logoutUri = `${window.location.origin}/`

export function buildLoginUrl(challenge: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  })
  return `https://${domain}/login?${params}`
}

export function buildLogoutUrl(): string {
  const params = new URLSearchParams({ client_id: clientId, logout_uri: logoutUri })
  return `https://${domain}/logout?${params}`
}

export const tokenEndpoint = `https://${domain}/oauth2/token`
export { redirectUri, clientId }
