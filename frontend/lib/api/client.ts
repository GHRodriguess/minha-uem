import { signOut } from "next-auth/react";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

export class ErroApi extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ErroApi";
  }
}

type QueryPrimitive = string | number | boolean;
type QueryValue = QueryPrimitive | QueryPrimitive[] | undefined | null;

type OpcoesRequisicao = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  token?: string;
};

function construirStringConsulta(query?: OpcoesRequisicao["query"]): string {
  if (!query) return "";
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === "") continue;
        sp.append(key, String(item));
      }
      continue;
    }
    sp.append(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function tratarNaoAutorizado() {
  if (typeof window === "undefined") return;
  signOut({ callbackUrl: "/login" });
}

export async function requisitar<T>(
  path: string,
  options: OpcoesRequisicao = {},
): Promise<T> {
  const { method = "GET", body, query, signal, token } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${path}${construirStringConsulta(query)}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    signal,
    cache: "no-store",
  });

  if (response.status === 401) {
    tratarNaoAutorizado();
    throw new ErroApi(401, "Não autorizado");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const parsed = text ? processarJsonSeguro(text) : undefined;

  if (!response.ok) {
    const message =
      (parsed as { erro?: string; message?: string } | undefined)?.erro ??
      (parsed as { erro?: string; message?: string } | undefined)?.message ??
      response.statusText ??
      "Erro na requisição";
    throw new ErroApi(response.status, message, parsed);
  }

  return parsed as T;
}

function processarJsonSeguro(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const api_client = {
  obter: <T>(
    path: string,
    query?: OpcoesRequisicao["query"],
    token?: string,
    signal?: AbortSignal,
  ) => requisitar<T>(path, { method: "GET", query, token, signal }),
  
  postar: <T>(path: string, body?: unknown, token?: string, signal?: AbortSignal) =>
    requisitar<T>(path, { method: "POST", body, token, signal }),
  
  atualizar: <T>(path: string, body?: unknown, token?: string, signal?: AbortSignal) =>
    requisitar<T>(path, { method: "PUT", body, token, signal }),
  
  patch: <T>(path: string, body?: unknown, token?: string, signal?: AbortSignal) =>
    requisitar<T>(path, { method: "PATCH", body, token, signal }),
  
  remover: <T = void>(path: string, token?: string, signal?: AbortSignal) =>
    requisitar<T>(path, { method: "DELETE", token, signal }),
};
