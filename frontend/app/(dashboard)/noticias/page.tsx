'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSuporte } from '@/components/providers/ProvedorSuporte'
import { suporte_servico, Noticia } from '@/lib/api/suporte'
import CardNoticia from '@/components/molecules/CardNoticia'
import GerenciadorNoticiasAdmin from '@/components/organisms/GerenciadorNoticiasAdmin'
import FiltroCategoriasNoticias from '@/components/molecules/FiltroCategoriasNoticias'
import { Button } from '@/components/ui/button'
import { PlusCircle, Newspaper } from 'lucide-react'

export default function NoticiasPage() {
  const { data: session } = useSession()
  const { usuarioMe } = useSuporte()
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [categoriaAtiva, setCategoriaAtiva] = useState('TODAS')
  const [noticiaEdicao, setNoticiaEdicao] = useState<Noticia | null>(null)
  const [formularioAberto, setFormularioAberto] = useState(false)

  const carregarNoticias = useCallback(async () => {
    if (!session?.accessToken) return
    try {
      const list = await suporte_servico.listarNoticias(session.accessToken)
      const ordenado = [...list].sort((a, b) => b.id - a.id)
      setNoticias(ordenado)
      if (ordenado.length > 0) {
        localStorage.setItem('lastReadNewsId', String(Math.max(...ordenado.map(n => n.id))))
      }
    } catch (e) {
      console.error(e)
    }
  }, [session?.accessToken])

  useEffect(() => {
    carregarNoticias()
  }, [carregarNoticias])

  const removerNoticia = async (id: number) => {
    if (!session?.accessToken) return
    try {
      await suporte_servico.excluirNoticia(session.accessToken, id)
      carregarNoticias()
    } catch (e) {
      console.error(e)
    }
  }

  const noticiasFiltradas = categoriaAtiva === 'TODAS'
    ? noticias
    : noticias.filter(n => n.category === categoriaAtiva)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-primary" />
            <span>Notícias e Comunicados</span>
          </h1>
          <p className="text-sm text-muted-foreground">Fique por dentro das atualizações e avisos oficiais da UEM.</p>
        </div>
        {usuarioMe?.is_staff && !formularioAberto && (
          <Button
            onClick={() => { setNoticiaEdicao(null); setFormularioAberto(true); }}
            className="text-xs font-bold rounded-xl gap-1.5 h-10 px-4"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Notícia</span>
          </Button>
        )}
      </div>

      {formularioAberto && (
        <GerenciadorNoticiasAdmin
          noticiaEmEdicao={noticiaEdicao}
          onSucesso={() => { setFormularioAberto(false); setNoticiaEdicao(null); carregarNoticias(); }}
          onCancelar={() => { setFormularioAberto(false); setNoticiaEdicao(null); }}
        />
      )}

      <FiltroCategoriasNoticias
        categorias={['TODAS', 'GERAL', 'ACADEMICO', 'CLASSROOM', 'MANUTENCAO']}
        categoriaAtiva={categoriaAtiva}
        onSelecionarCategoria={setCategoriaAtiva}
      />

      <div className="grid grid-cols-1 gap-4">
        {noticiasFiltradas.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-border rounded-2xl bg-card">
            <Newspaper className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm font-bold text-muted-foreground">Nenhuma notícia encontrada.</p>
          </div>
        ) : (
          noticiasFiltradas.map(n => (
            <CardNoticia
              key={n.id}
              noticia={n}
              isAdmin={!!usuarioMe?.is_staff}
              onEdit={(noticia) => { setNoticiaEdicao(noticia); setFormularioAberto(true); }}
              onDelete={removerNoticia}
            />
          ))
        )}
      </div>
    </div>
  )
}
