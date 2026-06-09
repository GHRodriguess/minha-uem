import { getSession } from "next-auth/react"
import { api_client } from "./client"

const base_path = "/api/academico/ia"

export interface EstatisticaUsoIA { model_name: string; requisicoes: number; total_tokens: number }
export interface StatusChaveIA { possui_chave: boolean; model_name: string; uso_hoje: EstatisticaUsoIA[] }
export interface RespostaChatIA { resposta: string }

export const ia_service = {
    obterConfig: (t: string, s?: AbortSignal) => api_client.obter<StatusChaveIA>(`${base_path}/config/`, {}, t, s),

    salvarConfig(token: string, apiKey?: string, modelName?: string, signal?: AbortSignal) {
        const body: Record<string, string> = {}
        if (apiKey) body.api_key = apiKey
        if (modelName) body.model_name = modelName
        return api_client.postar<{ sucesso: boolean }>(`${base_path}/config/`, body, token, signal)
    },

    removerConfig: (t: string, s?: AbortSignal) => api_client.remover<{ sucesso: boolean }>(`${base_path}/config/`, t, s),

    enviarMensagem(
        token: string,
        googleToken: string | null,
        mensagem: string,
        materiaId?: number,
        arquivoAbertoId?: string,
        arquivosSelecionadosIds?: string[],
        onChunk?: (texto: string) => void,
        signal?: AbortSignal,
        arquivosLocais?: Array<{ mime_type: string; base64_data: string }>
    ): Promise<RespostaChatIA> {
        const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        if (googleToken) headers["X-Google-Access-Token"] = googleToken
        if (typeof window !== "undefined") {
            const impersonated = localStorage.getItem("impersonatedUserEmail")
            if (impersonated) headers["X-Impersonate-User"] = impersonated
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000"

        return fetch(`${baseUrl}${base_path}/chat/`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                mensagem,
                materia_id: materiaId,
                arquivo_aberto_id: arquivoAbertoId,
                arquivos_selecionados_ids: arquivosSelecionadosIds,
                arquivos_locais: arquivosLocais
            }),
            signal
        }).then(async (res) => {
            if (res.status === 401) {
                const session = await getSession()
                const new_token = session?.accessToken
                if (new_token && new_token !== token) {
                    return ia_service.enviarMensagem(
                        new_token, googleToken, mensagem, materiaId,
                        arquivoAbertoId, arquivosSelecionadosIds, onChunk, signal, arquivosLocais
                    )
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
}
