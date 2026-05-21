import { JWT } from "next-auth/jwt"

const MARGEM_RENOVACAO_MS = 5 * 60 * 1000

export function googleTokenExpirado(token: JWT): boolean {
  if (!token.googleAccessTokenExpires) return false
  return Date.now() >= token.googleAccessTokenExpires - MARGEM_RENOVACAO_MS
}

export async function renovarGoogleAccessToken(token: JWT): Promise<JWT> {
  try {
    const resposta = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.googleRefreshToken!,
      }),
    })

    const dados = await resposta.json()

    if (!resposta.ok) throw dados

    return {
      ...token,
      googleAccessToken: dados.access_token,
      googleAccessTokenExpires: Date.now() + dados.expires_in * 1000,
      error: undefined,
    }
  } catch {
    return {
      ...token,
      error: "GoogleRefreshTokenError",
    }
  }
}
