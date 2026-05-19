import { Perfil } from "@/types/academico";
import { api_client } from "./client";

const base_path = "/api/academico";

export const academic_service = {
  obterPerfil(token: string, signal?: AbortSignal) {
    return api_client.obter<Perfil>(`${base_path}/perfil/`, undefined, token, signal);
  },
  
  enviarHorario(token: string, file: File, signal?: AbortSignal) {
    const form_data = new FormData();
    form_data.append("file", file);
    return api_client.postar<Perfil>(`${base_path}/upload-horario/`, form_data, token, signal);
  },

  atualizarFaltas(token: string, materia_id: number, data: string, aula: number, faltas: number, signal?: AbortSignal) {
    return api_client.postar<{materia_id: number, data: string, aula: number, faltas: number}>(`${base_path}/faltas/`, { materia_id, data, aula, faltas }, token, signal);
  }
};
