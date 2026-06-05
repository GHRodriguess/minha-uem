import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { googleTokenExpirado, renovarGoogleAccessToken } from "@/lib/service/renovarGoogleToken"

function obterExpiracaoJwt(token: string): number {
  try {
    const payload = token.split(".")[1]
    const dados = JSON.parse(
      Buffer.from(payload, "base64").toString("utf-8")
    )
    return dados.exp * 1000
  } catch {
    return Date.now() + 24 * 60 * 60 * 1000
  }
}

async function renovarTokenAcesso(token: any) {
  try {
    const urlApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

    const resposta = await fetch(`${urlApi}/api/auth/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh: token.refreshToken,
      }),
    })

    const dados = await resposta.json()

    if (!resposta.ok) {
      throw dados
    }

    return {
      ...token,
      accessToken: dados.access,
      accessTokenExpires: obterExpiracaoJwt(dados.access),
      refreshToken: dados.refresh ?? token.refreshToken,
    }
  } catch {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

const tratador = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.announcements.readonly https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.profile.emails https://www.googleapis.com/auth/classroom.profile.photos https://www.googleapis.com/auth/drive.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile, account }) {
      if (profile?.email?.endsWith("@uem.br")) {
        const scopes = account?.scope?.split(" ") || []
        const requiredScopes = [
          "https://www.googleapis.com/auth/classroom.rosters.readonly",
          "https://www.googleapis.com/auth/classroom.profile.emails",
          "https://www.googleapis.com/auth/classroom.profile.photos"
        ]
        const hasAll = requiredScopes.every(s => scopes.includes(s))
        if (!hasAll) {
          return "/login?error=PermissionsError"
        }
        return true
      }
      return false
    },
    async jwt({ token, account }) {
      if (account) {
        token.googleAccessToken = account.access_token
        token.googleRefreshToken = account.refresh_token
        token.googleAccessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 60 * 60 * 1000

        const urlApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

        try {
          const resposta = await fetch(`${urlApi}/api/auth/google/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: account.id_token,
              google_access_token: account.access_token,
            }),
          })

          if (resposta.ok) {
            const dados = await resposta.json()
            token.accessToken = dados.access
            token.refreshToken = dados.refresh
            token.accessTokenExpires = obterExpiracaoJwt(dados.access)
          }
        } catch (error) {
          console.error("Erro na autenticação com o backend:", error)
        }
        return token
      }

      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires - 10000) {
        if (googleTokenExpirado(token)) {
          return renovarGoogleAccessToken(token)
        }
        return token
      }

      const tokenRenovado = await renovarTokenAcesso(token)

      if (googleTokenExpirado(tokenRenovado)) {
        return renovarGoogleAccessToken(tokenRenovado)
      }

      return tokenRenovado
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.googleAccessToken = token.googleAccessToken as string
      session.error = token.error as string
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})

export { tratador as GET, tratador as POST }
