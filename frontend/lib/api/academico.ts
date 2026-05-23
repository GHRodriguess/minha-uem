import { Perfil, ConfiguracaoMateria, Avaliacao, AnotacaoMateria } from "@/types/academico";
import { api_client } from "./client";

const base_path = "/api/academico";

export const academic_service = {
  obterPerfil(token: string, ano_id?: number, signal?: AbortSignal) {
    return api_client.obter<Perfil>(`${base_path}/perfil/`, { ano_id }, token, signal);
  },

  enviarHorario(token: string, file: File, confirmar: boolean = false, signal?: AbortSignal) {
    const form_data = new FormData();
    form_data.append("file", file);
    if (confirmar) {
      form_data.append("confirmar", "true");
    }
    return api_client.postar<Perfil | { conflito: boolean, ano: number, mensagem: string }>(`${base_path}/upload-horario/`, form_data, token, signal);
  },

  atualizarFaltas(token: string, materia_id: number, data: string, aula: number, faltas: number, ano_id?: number, signal?: AbortSignal) {
    return api_client.postar<{materia_id: number, data: string, aula: number, faltas: number}>(`${base_path}/controle-falta/`, { materia_id, data, aula, faltas, ano_id }, token, signal);
  },

  obterConfiguracaoNotas(token: string, materia_id: number, ano_id: number, signal?: AbortSignal) {
    return api_client.obter<ConfiguracaoMateria>(`${base_path}/configuracao-notas/`, { materia_id, ano_id }, token, signal);
  },

  atualizarConfiguracaoNotas(token: string, materia_id: number, ano_id: number, data: Partial<ConfiguracaoMateria>, signal?: AbortSignal) {
    return api_client.patch<ConfiguracaoMateria>(`${base_path}/configuracao-notas/`, { materia_id, ano_id, ...data }, token, signal);
  },

  criarAvaliacao(token: string, configuracao_id: number, data: Partial<Avaliacao>, signal?: AbortSignal) {
    return api_client.postar<Avaliacao>(`${base_path}/avaliacoes/`, { configuracao_id, ...data }, token, signal);
  },

  atualizarAvaliacao(token: string, avaliacao_id: number, data: Partial<Avaliacao>, signal?: AbortSignal) {
    return api_client.patch<Avaliacao>(`${base_path}/avaliacoes/${avaliacao_id}/`, data, token, signal);
  },

  excluirAvaliacao(token: string, avaliacao_id: number, signal?: AbortSignal) {
    return api_client.remover(`${base_path}/avaliacoes/${avaliacao_id}/`, token, signal);
  },

  obterLinkAgenda(token: string, signal?: AbortSignal) {
    return api_client.obter<{ feed_url: string }>(`${base_path}/agenda/info/`, {}, token, signal);
  },

  regenerarLinkAgenda(token: string, signal?: AbortSignal) {
    return api_client.postar<{ feed_url: string }>(`${base_path}/agenda/regenerar/`, {}, token, signal);
  },

  criarAnotacao(token: string, configuracao_id: number, content: string, signal?: AbortSignal) {
    return api_client.postar<AnotacaoMateria>(`${base_path}/anotacoes/`, { configuracao_id, content }, token, signal);
  },

  atualizarAnotacao(token: string, anotacao_id: number, content: string, signal?: AbortSignal) {
    return api_client.patch<AnotacaoMateria>(`${base_path}/anotacoes/${anotacao_id}/`, { content }, token, signal);
  },

  excluirAnotacao(token: string, anotacao_id: number, signal?: AbortSignal) {
    return api_client.remover(`${base_path}/anotacoes/${anotacao_id}/`, token, signal);
  }
};
