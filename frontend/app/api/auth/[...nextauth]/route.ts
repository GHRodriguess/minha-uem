import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const tratador = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/drive.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
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
        const urlApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        
        const resposta = await fetch(`${urlApi}/api/auth/google/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
        }
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      return session
    },
  },
  pages: {
    signIn: '/login',
  }
})

export { tratador as GET, tratador as POST }
