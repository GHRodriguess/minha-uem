'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { academic_service } from '@/lib/api/academico'
import { AnoLetivo } from '@/types/academico'

interface ContextoAcademicoData {
  anoAtivoId: number | null
  setAnoAtivoId: (id: number | null) => void
  anosDisponiveis: AnoLetivo[]
  carregandoAnos: boolean
  atualizarAnos: () => Promise<void>
  versao: number
  notificarMudanca: () => void
}

const ContextoAcademico = createContext<ContextoAcademicoData>({} as ContextoAcademicoData)

export function ProvedorAcademico({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [anoAtivoId, setAnoAtivoIdState] = useState<number | null>(null)
  const [anosDisponiveis, setAnosDisponiveis] = useState<AnoLetivo[]>([])
  const [carregandoAnos, setCarregandoAnos] = useState(false)
  const [versao, setVersao] = useState(0)

  const notificarMudanca = useCallback(() => {
    setVersao(v => v + 1)
  }, [])

  const atualizarAnos = useCallback(async () => {
    if (!session?.accessToken) return
    
    setCarregandoAnos(true)
    try {
      const perfil = await academic_service.obterPerfil(session.accessToken)
      if (perfil.anos) {
        setAnosDisponiveis(perfil.anos)
        
        // Se não houver ano ativo selecionado, tenta recuperar do localStorage
        // ou seleciona o mais recente
        const salvo = localStorage.getItem('anoAtivoId')
        if (salvo) {
          const idSalvo = parseInt(salvo)
          if (perfil.anos.some(a => a.id === idSalvo)) {
            setAnoAtivoIdState(idSalvo)
          } else if (perfil.anos.length > 0) {
            setAnoAtivoIdState(perfil.anos[0].id)
          }
        } else if (perfil.anos.length > 0) {
          const maisRecente = [...perfil.anos].sort((a, b) => b.ano - a.ano)[0]
          setAnoAtivoIdState(maisRecente.id)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar anos disponíveis:', error)
    } finally {
      setCarregandoAnos(false)
    }
  }, [session?.accessToken])

  useEffect(() => {
    atualizarAnos()
  }, [atualizarAnos])

  const setAnoAtivoId = (id: number | null) => {
    setAnoAtivoIdState(id)
    if (id) {
      localStorage.setItem('anoAtivoId', id.toString())
    } else {
      localStorage.removeItem('anoAtivoId')
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
      notificarMudanca
    }}>
      {children}
    </ContextoAcademico.Provider>
  )
}

export function useAcademico() {
  return useContext(ContextoAcademico)
}
