import { getSession } from "next-auth/react"
import { api_client } from "./client"

const base_path = "/api/academico/ia"

export interface EstatisticaUsoIA { model_name: string; requisicoes: number; total_tokens: number }
export interface StatusChaveIA { possui_chave: boolean; model_name: string; uso_hoje: EstatisticaUsoIA[] }
export interface RespostaChatIA { resposta: string }
export interface Conversa { id: number; title: string; materia_id: number | null; updated_at: string }
export interface GrupoConversas {
    geral: Conversa[]
    disciplinas: Array<{ materia_id: number; codigo: string; nome: string; chats: Conversa[] }>
}
export interface MensagemHistorico { role: 'conversa' | 'user' | 'model'; text: string; created_at: string }

async function executarChamadaStreaming(
    url: string,
    body: any,
    token: string,
    googleToken: string | null,
    onChunk?: (texto: string) => void,
    signal?: AbortSignal
): Promise<RespostaChatIA> {
    const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    if (googleToken) headers["X-Google-Access-Token"] = googleToken
    if (typeof window !== "undefined") {
        const impersonated = localStorage.getItem("impersonatedUserEmail")
        if (impersonated) headers["X-Impersonate-User"] = impersonated
    }

    return fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal
    }).then(async (res) => {
        if (res.status === 401) {
            const session = await getSession()
            const new_token = session?.accessToken
            if (new_token && new_token !== token) {
                return executarChamadaStreaming(url, body, new_token, googleToken, onChunk, signal)
            }
        }

        if (!res.ok) {
            const text = await res.text()
            let erroMsg = "Erro na requisição"
            try { erroMsg = JSON.parse(text).erro || erroMsg } catch {}
            throw { status: res.status, message: erroMsg }
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) return { resposta: "" }

        let fullText = ""
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            fullText += chunk
            if (onChunk) onChunk(chunk)
        }
        return { resposta: fullText }
    })
}

export const ia_service = {
    obterConfig: (t: string, s?: AbortSignal) => api_client.obter<StatusChaveIA>(`${base_path}/config/`, {}, t, s),

    salvarConfig(token: string, apiKey?: string, modelName?: string, signal?: AbortSignal) {
        const body: Record<string, string> = {}
        if (apiKey) body.api_key = apiKey
        if (modelName) body.model_name = modelName
        return api_client.postar<{ sucesso: boolean }>(`${base_path}/config/`, body, token, signal)
    },

    removerConfig: (t: string, s?: AbortSignal) => api_client.remover<{ sucesso: boolean }>(`${base_path}/config/`, t, s),

    listarConversas: (t: string, s?: AbortSignal) => api_client.obter<GrupoConversas>(`${base_path}/conversas/`, {}, t, s),

    criarConversa: (t: string, title?: string, materiaId?: number, s?: AbortSignal) =>
        api_client.postar<Conversa>(`${base_path}/conversas/`, { title, materia_id: materiaId }, t, s),

    obterMensagensConversa: (conversaId: number, t: string, s?: AbortSignal) =>
        api_client.obter<{ id: number; title: string; materia_id: number | null; messages: MensagemHistorico[] }>(`${base_path}/conversas/${conversaId}/`, {}, t, s),

    excluirConversa: (conversaId: number, t: string, s?: AbortSignal) =>
        api_client.remover<{ sucesso: boolean }>(`${base_path}/conversas/${conversaId}/`, t, s),

    enviarMensagemConversa(
        token: string,
        googleToken: string | null,
        conversaId: number,
        mensagem: string,
        arquivoAbertoId?: string,
        arquivosSelecionadosIds?: string[],
        onChunk?: (texto: string) => void,
        signal?: AbortSignal,
        arquivosLocais?: Array<{ mime_type: string; base64_data: string }>
    ): Promise<RespostaChatIA> {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000"
        return executarChamadaStreaming(
            `${baseUrl}${base_path}/conversas/${conversaId}/enviar/`,
            {
                mensagem,
                arquivo_aberto_id: arquivoAbertoId,
                arquivos_selecionados_ids: arquivosSelecionadosIds,
                arquivos_locais: arquivosLocais
            },
            token,
            googleToken,
            onChunk,
            signal
        )
    }
}
