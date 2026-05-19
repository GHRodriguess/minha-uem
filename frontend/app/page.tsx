'use client'

import { useSession, signOut } from 'next-auth/react'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const encerrarSessao = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-4 gap-4">
      <div className="bg-white p-8 shadow-xl rounded-2xl max-w-md w-full border border-gray-100 text-center">
        <h1 className="text-2xl font-bold">Olá, {session.user?.name}!</h1>
        <p className="text-gray-500 mt-2">Você está autenticado com {session.user?.email}</p>
        <button
          onClick={encerrarSessao}
          className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-full"
        >
          Sair
        </button>
      </div>
    </main>
  )
}
