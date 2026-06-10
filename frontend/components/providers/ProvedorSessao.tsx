'use client'

import { SessionProvider } from 'next-auth/react'

if (typeof window !== "undefined") {
  const verificarErro401 = (arg: any): boolean => {
    if (!arg) {
      return false;
    }
    if (typeof arg === "object") {
      if (arg.status === 401 || arg.statusCode === 401 || arg.status_code === 401) {
        return true;
      }
      if (arg.name === "ErroApi" && arg.status === 401) {
        return true;
      }
      if (arg.message && (arg.message.includes("401") || arg.message.includes("Não autorizado"))) {
        return true;
      }
    }
    if (typeof arg === "string") {
      if (arg.includes("401") || arg.includes("Não autorizado")) {
        return true;
      }
    }
    return false;
  }

  const originalConsoleError = console.error
  console.error = (...args: any[]) => {
    const hasStatus401 = args.some(verificarErro401)
    if (hasStatus401) {
      return
    }
    originalConsoleError(...args)
  }

  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason
    if (verificarErro401(error)) {
      event.preventDefault()
    }
  })
}

export default function ProvedorSessao({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={55 * 60} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  )
}
