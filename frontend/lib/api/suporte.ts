import { api_client } from './client'

export interface UsuarioMe {
  username: string
  email: string
  is_staff: boolean
}

export interface MensagemSuporte {
  id: number
  ticket: number
  sender: number
  sender_username: string
  sender_email: string
  message: string
  created_at: string
}

export interface ChamadoSuporte {
  id: number
  user: number
  user_username: string
  user_email: string
  title: string
  category: 'INTERFACE' | 'ACADEMICO' | 'CLASSROOM' | 'OUTRO'
  status: 'ABERTO' | 'RESOLVIDO'
  created_at: string
  updated_at: string
  read_by_user: boolean
  read_by_admin: boolean
  mensagens?: MensagemSuporte[]
}

export interface EstatisticasAdmin {
  total_users: number
  active_profiles: number
  total_courses: number
  total_subjects: number
  open_tickets: number
  resolved_tickets: number
}

export interface MateriaSimplificada {
  codigo: string
  nome: string
}

export interface UsuarioAdminDet {
  id: number
  username: string
  email: string
  nome_completo: string
  first_name: string
  last_name: string
  date_joined: string
  last_login: string | null
  curso_nome: string
  total_materias: number
  materias: MateriaSimplificada[]
  is_staff: boolean
}

export interface Noticia {
  id: number
  title: string
  content: string
  category: 'GERAL' | 'ACADEMICO' | 'CLASSROOM' | 'MANUTENCAO'
  author: number
  author_username: string
  author_first_name: string
  created_at: string
  updated_at: string
}

export const suporte_servico = {
  obterUsuarioMe: async (token: string): Promise<UsuarioMe> => {
    return api_client.obter<UsuarioMe>('/api/auth/me/', undefined, token)
  },

  listarChamados: async (token: string, admin = false): Promise<ChamadoSuporte[]> => {
    return api_client.obter<ChamadoSuporte[]>('/api/academico/suporte/chamados/', { admin }, token)
  },

  criarChamado: async (token: string, title: string, category: string, message: string): Promise<ChamadoSuporte> => {
    return api_client.postar<ChamadoSuporte>('/api/academico/suporte/chamados/', { title, category, message }, token)
  },

  obterDetalhesChamado: async (token: string, id: number, admin = false): Promise<ChamadoSuporte> => {
    return api_client.obter<ChamadoSuporte>(`/api/academico/suporte/chamados/${id}/`, { admin }, token)
  },

  enviarMensagemChamado: async (token: string, id: number, message: string, admin = false): Promise<MensagemSuporte> => {
    return api_client.postar<MensagemSuporte>(`/api/academico/suporte/chamados/${id}/?admin=${admin}`, { message }, token)
  },

  atualizarStatusChamado: async (token: string, id: number, status: 'ABERTO' | 'RESOLVIDO'): Promise<ChamadoSuporte> => {
    return api_client.patch<ChamadoSuporte>(`/api/academico/suporte/chamados/${id}/status/`, { status }, token)
  },

  obterEstatisticasAdmin: async (token: string): Promise<EstatisticasAdmin> => {
    return api_client.obter<EstatisticasAdmin>('/api/academico/admin/estatisticas/', undefined, token)
  },

  listarUsuariosAdmin: async (token: string): Promise<UsuarioAdminDet[]> => {
    return api_client.obter<UsuarioAdminDet[]>('/api/academico/admin/usuarios/', undefined, token)
  },

  alternarAcessoAdmin: async (token: string, userId: number): Promise<UsuarioAdminDet> => {
    return api_client.patch<UsuarioAdminDet>(`/api/academico/admin/usuarios/${userId}/alternar-staff/`, undefined, token)
  },

  listarNoticias: async (token: string): Promise<Noticia[]> => {
    return api_client.obter<Noticia[]>('/api/academico/noticias/', undefined, token)
  },

  criarNoticia: async (token: string, title: string, content: string, category: string): Promise<Noticia> => {
    return api_client.postar<Noticia>('/api/academico/noticias/', { title, content, category }, token)
  },

  atualizarNoticia: async (token: string, id: number, title: string, content: string, category: string): Promise<Noticia> => {
    return api_client.patch<Noticia>(`/api/academico/noticias/${id}/`, { title, content, category }, token)
  },

  excluirNoticia: async (token: string, id: number): Promise<void> => {
    return api_client.remover<void>(`/api/academico/noticias/${id}/`, token)
  }
}
