import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { googleTokenExpirado, renovarGoogleAccessToken } from "@/lib/service/renovarGoogleToken"

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
      accessTokenExpires: Date.now() + 60 * 60 * 1000,
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
          scope: "openid email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.announcements.readonly https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/drive.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (profile?.email?.endsWith("@uem.br")) {
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

        const dados = await resposta.json()

        if (resposta.ok) {
          token.accessToken = dados.access
          token.refreshToken = dados.refresh
          token.accessTokenExpires = Date.now() + 60 * 60 * 1000
        }
        return token
      }

      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
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
