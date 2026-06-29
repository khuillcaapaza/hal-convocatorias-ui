import axios from "axios";
import type {
  Convocatoria,
  ConvocatoriaInput,
  ConvocatoriaMeta,
  LoginChallenge,
  LoginResponse,
  UploadResult,
  Usuario,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";
const FILES_API_BASE = process.env.NEXT_PUBLIC_FILES_API_BASE || "";
const TOKEN_KEY = "convocatorias_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

const http = axios.create({ baseURL: API_BASE });

// Añade el token a cada petición si existe.
http.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Normaliza errores y gestiona la expiración de sesión (401).
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? "";
    // 401 en rutas protegidas => cerrar sesión (no en el propio /login).
    if (status === 401 && !url.includes("/login")) {
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:logout"));
      }
      return Promise.reject(new Error("Sesión expirada. Vuelve a entrar."));
    }
    const msg =
      error?.response?.data?.error || error?.message || "Error en la solicitud";
    return Promise.reject(new Error(msg));
  }
);

export async function login(
  email: string,
  password: string
): Promise<LoginChallenge> {
  const { data } = await http.post<LoginChallenge>("/login", {
    email,
    password,
  });
  return data;
}

export async function verifyCode(
  email: string,
  codigo: string
): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>("/login/verify", {
    email,
    codigo,
  });
  return data;
}

export async function fetchPerfil(): Promise<Usuario> {
  const { data } = await http.get<{ usuario: Usuario }>("/me");
  return data.usuario;
}

// ── Convocatorias (administración, requiere JWT) ───────────────────────

export async function fetchConvocatorias(): Promise<ConvocatoriaMeta[]> {
  const { data } = await http.get<{ convocatorias: ConvocatoriaMeta[] }>(
    "/admin/convocatorias"
  );
  return data.convocatorias;
}

export async function fetchConvocatoria(slug: string): Promise<Convocatoria> {
  const { data } = await http.get<{ convocatoria: Convocatoria }>(
    `/admin/convocatorias/${encodeURIComponent(slug)}`
  );
  return data.convocatoria;
}

export async function crearConvocatoria(
  input: ConvocatoriaInput
): Promise<string> {
  const { data } = await http.post<{ slug: string }>(
    "/admin/convocatorias",
    input
  );
  return data.slug;
}

export async function actualizarConvocatoria(
  slug: string,
  input: ConvocatoriaInput
): Promise<void> {
  await http.put(`/admin/convocatorias/${encodeURIComponent(slug)}`, input);
}

export async function eliminarConvocatoria(slug: string): Promise<void> {
  await http.delete(`/admin/convocatorias/${encodeURIComponent(slug)}`);
}

export async function registrarArchivo(
  slug: string,
  meta: { etiqueta: string; nombre: string; ext: string; tamano: number }
): Promise<number> {
  const { data } = await http.post<{ id: number }>(
    `/admin/convocatorias/${encodeURIComponent(slug)}/archivos`,
    meta
  );
  return data.id;
}

export async function eliminarArchivo(slug: string, id: number): Promise<void> {
  await http.delete(
    `/admin/convocatorias/${encodeURIComponent(slug)}/archivos/${id}`
  );
}

// ── Subida directa a hal-archivos-api (multipart) ──────────────────────

export async function subirArchivo(
  slug: string,
  archivo: File,
  onProgress?: (porcentaje: number) => void
): Promise<UploadResult> {
  const form = new FormData();
  form.append("slug", slug);
  form.append("archivo", archivo);
  const token = getToken();
  const { data } = await axios.post<UploadResult>(
    `${FILES_API_BASE}/upload`,
    form,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      onUploadProgress: (e) => {
        if (!onProgress) return;
        const total = e.total ?? archivo.size;
        if (total > 0) {
          onProgress(Math.min(100, Math.round((e.loaded * 100) / total)));
        }
      },
    }
  );
  return data;
}

/** Borra el binario físico (usado para revertir subidas huérfanas). */
export async function eliminarArchivoFisico(
  slug: string,
  nombre: string
): Promise<void> {
  const token = getToken();
  await axios.delete(`${FILES_API_BASE}/delete`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    data: { slug, nombre },
  });
}

export default http;
