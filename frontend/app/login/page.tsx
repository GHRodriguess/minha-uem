'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import CardLogin from '@/components/organisms/CardLogin'

function ConteudoLogin() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const erro = searchParams.get('error')

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <main className="flex-1 flex items-center justify-center bg-background p-4">
      <CardLogin erro={erro} />
    </main>
  )
}

export default function PaginaLogin() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <ConteudoLogin />
    </Suspense>
  )
}
