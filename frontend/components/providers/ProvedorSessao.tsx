'use client'

import { SessionProvider } from 'next-auth/react'

export default function ProvedorSessao({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={55 * 60} refetchOnWindowFocus={true}>
      {children}
    </SessionProvider>
  )
}
