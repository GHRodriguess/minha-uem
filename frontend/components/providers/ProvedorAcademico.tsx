'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { academic_service } from '@/lib/api/academico'
import { AnoLetivo, Perfil } from '@/types/academico'

interface ContextoAcademicoData {
  anoAtivoId: number | null
  setAnoAtivoId: (id: number | null) => void
  anosDisponiveis: AnoLetivo[]
  carregandoAnos: boolean
  atualizarAnos: () => Promise<void>
  versao: number
  notificarMudanca: () => void
  perfil: Perfil | null
  setPerfil: React.Dispatch<React.SetStateAction<Perfil | null>>
}

const ContextoAcademico = createContext<ContextoAcademicoData>({} as ContextoAcademicoData)

export function ProvedorAcademico({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [anoAtivoId, setAnoAtivoIdState] = useState<number | null>(null)
  const [anosDisponiveis, setAnosDisponiveis] = useState<AnoLetivo[]>([])
  const [carregandoAnos, setCarregandoAnos] = useState(true)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [versao, setVersao] = useState(0)

  const notificarMudanca = useCallback(() => {
    setVersao(v => v + 1)
  }, [])

  const atualizarAnos = useCallback(async () => {
    if (!session?.accessToken) {
      setCarregandoAnos(false)
      return
    }
    
    setCarregandoAnos(true)
    try {
      let activeId: number | null = null
      const salvo = localStorage.getItem('anoAtivoId')
      if (salvo) {
        activeId = parseInt(salvo)
      }

      const data = await academic_service.obterPerfil(
        session.accessToken, 
        activeId || undefined, 
        true, 
        true
      )
      
      setPerfil(data)
      
      if (data.anos) {
        setAnosDisponiveis(data.anos)
        
        if (activeId && data.anos.some(a => a.id === activeId)) {
          setAnoAtivoIdState(activeId)
        } else if (data.anos.length > 0) {
          const maisRecente = [...data.anos].sort((a, b) => b.ano - a.ano)[0]
          setAnoAtivoIdState(maisRecente.id)
          localStorage.setItem('anoAtivoId', maisRecente.id.toString())
          
          if (!activeId) {
            const dataRecente = await academic_service.obterPerfil(
              session.accessToken, 
              maisRecente.id, 
              true, 
              true
            )
            setPerfil(dataRecente)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setCarregandoAnos(false)
    }
  }, [session?.accessToken])

  useEffect(() => {
    atualizarAnos()
  }, [atualizarAnos, versao])

  const setAnoAtivoId = async (id: number | null) => {
    setAnoAtivoIdState(id)
    if (id) {
      localStorage.setItem('anoAtivoId', id.toString())
      if (session?.accessToken) {
        setCarregandoAnos(true)
        try {
          const data = await academic_service.obterPerfil(session.accessToken, id, true, true)
          setPerfil(data)
        } catch (error) {
          console.error(error)
        } finally {
          setCarregandoAnos(false)
        }
      }
    } else {
      localStorage.removeItem('anoAtivoId')
      setPerfil(null)
    }
  }

  return (
    <ContextoAcademico.Provider value={{ 
      anoAtivoId, 
      setAnoAtivoId, 
      anosDisponiveis, 
      carregandoAnos,
      atualizarAnos,
      versao,
      notificarMudanca,
      perfil,
      setPerfil
    }}>
      {children}
    </ContextoAcademico.Provider>
  )
}

export function useAcademico() {
  return useContext(ContextoAcademico)
}
