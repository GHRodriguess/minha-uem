import { getSession, signOut } from "next-auth/react";
import { api_client } from "./client";

const base_path = "/api/academico/classroom";

async function executarComRenovacaoGoogle<T>(
    operacao: (tokenGoogle: string) => Promise<T>,
    initialGoogleToken: string | null
): Promise<T> {
    let currentGoogleToken = initialGoogleToken;
    if (!currentGoogleToken) {
        const session = await getSession();
        currentGoogleToken = session?.googleAccessToken || null;
    }

    if (!currentGoogleToken) {
        signOut({ callbackUrl: "/login" });
        throw new Error("Token do Google não disponível");
    }

    try {
        return await operacao(currentGoogleToken);
    } catch (error) {
        const bodyObj =
            error && typeof error === "object" && "body" in error
                ? (error.body as any)
                : null;

        const isGoogleTokenExpired =
            (bodyObj && bodyObj.codigo === "GOOGLE_TOKEN_EXPIRADO") ||
            (error &&
                typeof error === "object" &&
                "message" in error &&
                String(error.message).includes("Token do Google expirado"));

        if (isGoogleTokenExpired) {
            const sessionRes = await fetch(`/api/auth/session?update&t=${Date.now()}`);
            if (sessionRes.ok) {
                const sessionData = await sessionRes.json();
                const newGoogleToken = sessionData?.googleAccessToken || null;
                if (newGoogleToken && newGoogleToken !== currentGoogleToken) {
                    try {
                        return await operacao(newGoogleToken);
                    } catch (retryError) {
                        signOut({ callbackUrl: "/login" });
                        throw retryError;
                    }
                }
            }
            signOut({ callbackUrl: "/login" });
        }
        throw error;
    }
}

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
    is_ignored: boolean;
}

export interface StatusVinculoClassroom {
    vinculado: boolean;
    classroom_course_id?: string;
    classroom_course_name?: string;
    curso_nome?: string;
    ano_letivo?: string;
    materia_nome?: string;
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
        return executarComRenovacaoGoogle(
            (tokenGoogleUsar) =>
                api_client.obter<CursoClassroom[]>(
                    `${base_path}/cursos/`,
                    {},
                    token,
                    signal,
                    { "X-Google-Access-Token": tokenGoogleUsar },
                ),
            googleToken,
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
        return executarComRenovacaoGoogle(
            (tokenGoogleUsar) => {
                const headers: Record<string, string> = {
                    "X-Google-Access-Token": tokenGoogleUsar,
                };
                return api_client.obter<StatusVinculoClassroom>(
                    `${base_path}/arquivos/`,
                    { materia_id: materiaId, ano_id: anoId },
                    token,
                    signal,
                    headers,
                );
            },
            googleToken,
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
        driveFileId: string,
        materiaId: number,
        anoId: number,
        originalName: string,
        localPath: string,
        selectedFolder: string,
        signal?: AbortSignal,
    ) {
        return api_client.postar<ArquivoClassroom>(
            `${base_path}/arquivos/${driveFileId}/baixar/`,
            {
                materia_id: materiaId,
                ano_id: anoId,
                original_name: originalName,
                local_path: localPath,
                selected_folder: selectedFolder
            },
            token,
            signal,
        );
    },

    obterConteudoArquivo(
        token: string,
        googleToken: string,
        driveFileId: string,
        signal?: AbortSignal,
    ) {
        return executarComRenovacaoGoogle(
            (tokenGoogleUsar) =>
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}${base_path}/arquivos/${driveFileId}/conteudo/`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "X-Google-Access-Token": tokenGoogleUsar,
                    },
                    signal,
                }).then((res) => {
                    if (!res.ok) throw new Error("Erro ao obter conteúdo do arquivo no Drive");
                    return res.blob();
                }),
            googleToken,
        );
    },

    abrirArquivoLocal(token: string, id: number, signal?: AbortSignal) {
        return api_client.postar<{ sucesso: boolean }>(
            `${base_path}/arquivos/abrir/`,
            { id },
            token,
            signal,
        );
    },

    adicionarArquivoLocal(
        token: string,
        materiaId: number,
        anoId: number,
        folderCategory: string,
        originalName: string,
        localPath: string,
        signal?: AbortSignal,
    ) {
        return api_client.postar<ArquivoClassroom>(
            `${base_path}/arquivos/upload-local/`,
            {
                materia_id: materiaId,
                ano_id: anoId,
                selected_folder: folderCategory,
                original_name: originalName,
                local_path: localPath,
            },
            token,
            signal,
        );
    },

    sincronizarArquivosLocais(
        token: string,
        materiaId: number,
        anoId: number,
        arquivos: Array<{
            drive_file_id: string | null;
            original_name: string;
            selected_folder: string;
            local_path: string;
        }>,
        signal?: AbortSignal,
    ) {
        return api_client.postar<ArquivoClassroom[]>(
            `${base_path}/arquivos/sincronizar/`,
            {
                materia_id: materiaId,
                ano_id: anoId,
                arquivos,
            },
            token,
            signal,
        );
    },
};
