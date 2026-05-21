import { api_client } from "./client";

const base_path = "/api/academico/classroom";

export interface CursoClassroom {
    id: string;
    name: string;
}

export interface ConfiguracaoClassroom {
    id?: number;
    download_dir: string;
    folder_options: string;
}

export interface ArquivoClassroom {
    id: number | null;
    drive_file_id: string;
    original_name: string;
    custom_name: string | null;
    selected_folder: string;
    is_downloaded: boolean;
    local_path: string | null;
    sync_at: string | null;
}

export interface StatusVinculoClassroom {
    vinculado: boolean;
    classroom_course_id?: string;
    classroom_course_name?: string;
    arquivos: ArquivoClassroom[];
}

export interface ItemDiretorio {
    nome: string;
    path: string;
    tipo: "diretorio";
}

export interface ResultadoExploracao {
    atual: string;
    itens: ItemDiretorio[];
}

export const classroom_service = {
    explorarDiretorios(token: string, path?: string, signal?: AbortSignal) {
        return api_client.obter<ResultadoExploracao>(
            `${base_path}/explorar-diretorios/`,
            { path },
            token,
            signal,
        );
    },

    obterConfiguracao(token: string, signal?: AbortSignal) {
        return api_client.obter<ConfiguracaoClassroom>(
            `${base_path}/config/`,
            {},
            token,
            signal,
        );
    },

    atualizarConfiguracao(
        token: string,
        dados: Partial<ConfiguracaoClassroom>,
        signal?: AbortSignal,
    ) {
        return api_client.patch<ConfiguracaoClassroom>(
            `${base_path}/config/`,
            dados,
            token,
            signal,
        );
    },

    listarCursosClassroom(
        token: string,
        googleToken: string,
        signal?: AbortSignal,
    ) {
        return api_client.obter<CursoClassroom[]>(
            `${base_path}/cursos/`,
            {},
            token,
            signal,
            { "X-Google-Access-Token": googleToken },
        );
    },

    vincularCurso(
        token: string,
        materiaId: number,
        anoId: number,
        courseId: string,
        courseName: string,
        signal?: AbortSignal,
    ) {
        return api_client.postar<StatusVinculoClassroom>(
            `${base_path}/vincular/`,
            {
                materia_id: materiaId,
                ano_id: anoId,
                classroom_course_id: courseId,
                classroom_course_name: courseName,
            },
            token,
            signal,
        );
    },

    desvincularCurso(
        token: string,
        materiaId: number,
        anoId: number,
        signal?: AbortSignal,
    ) {
        return api_client.remover(
            `${base_path}/vincular/?materia_id=${materiaId}&ano_id=${anoId}`,
            token,
            signal,
        );
    },

    obterArquivos(
        token: string,
        googleToken: string | null,
        materiaId: number,
        anoId: number,
        signal?: AbortSignal,
    ) {
        const headers: Record<string, string> = {};
        if (googleToken) {
            headers["X-Google-Access-Token"] = googleToken;
        }
        return api_client.obter<StatusVinculoClassroom>(
            `${base_path}/arquivos/`,
            { materia_id: materiaId, ano_id: anoId },
            token,
            signal,
            headers,
        );
    },

    atualizarArquivo(
        token: string,
        driveFileId: string,
        materiaId: number,
        anoId: number,
        originalName: string,
        dados: Partial<ArquivoClassroom>,
        signal?: AbortSignal,
    ) {
        return api_client.patch<ArquivoClassroom>(
            `${base_path}/arquivos/${driveFileId}/`,
            {
                ...dados,
                materia_id: materiaId,
                ano_id: anoId,
                original_name: originalName,
            },
            token,
            signal,
        );
    },

    baixarArquivo(
        token: string,
        googleToken: string,
        driveFileId: string,
        materiaId: number,
        anoId: number,
        originalName: string,
        signal?: AbortSignal,
    ) {
        return api_client.postar<ArquivoClassroom>(
            `${base_path}/arquivos/${driveFileId}/baixar/`,
            {
                materia_id: materiaId,
                ano_id: anoId,
                original_name: originalName,
            },
            token,
            signal,
            { "X-Google-Access-Token": googleToken },
        );
    },
};
