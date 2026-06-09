import { useEffect } from 'react'
import { ia_service } from '@/lib/api/ia'

export function useCarregarDadosIA(
  session: any,
  isOpen: boolean,
  materiaId: number | undefined,
  anoAtivoId: number | null,
  filesCache: any,
  obterArquivos: (materiaId: number, anoId: number) => Promise<any>,
  setHasKey: (v: boolean) => void,
  setModelName: (v: string) => void
) {
  useEffect(() => {
    if (session?.accessToken && isOpen) {
      ia_service.obterConfig(session.accessToken)
        .then(res => {
          setHasKey(res.possui_chave)
          if (res.model_name) setModelName(res.model_name)
        })
        .catch(console.error)
    }
  }, [session, isOpen, setHasKey, setModelName])

  useEffect(() => {
    if (materiaId && anoAtivoId && isOpen && !filesCache[materiaId]) {
      obterArquivos(materiaId, anoAtivoId)
    }
  }, [materiaId, anoAtivoId, isOpen, filesCache, obterArquivos])
}
