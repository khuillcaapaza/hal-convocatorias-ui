import axios from "axios";
import type {
  Convocatoria,
  ConvocatoriaInput,
  ConvocatoriaMeta,
  UploadResult,
  Usuario,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";
const FILES_API_BASE = process.env.NEXT_PUBLIC_FILES_API_BASE || "";
const COOKIE_NAME = "hal_token";
const COOKIE_DOMAIN =
  process.env.NEXT_PUBLIC_COOKIE_DOMAIN || ".hospitalantoniolorena.gob.pe";
const HAL_AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3005";

// ── Cookie SSO (escrita por hal-auth) ───────────────────────────────

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function clearToken(): void {
  if (typeof document === "undefined") return;
  const base = `${COOKIE_NAME}=; path=/; max-age=0`;
  // Borra la cookie en el dominio actual, en el dominio SSO compartido y en
  // localhost (dev). En prod la cookie vive en .hospitalantoniolorena.gob.pe,
  // así que sin el dominio correcto el logout no la eliminaba.
  document.cookie = base;
  document.cookie = `${base}; domain=${COOKIE_DOMAIN}`;
  document.cookie = `${base}; domain=localhost`;
}

export function redirectToAuth(): void {
  if (typeof window === "undefined") return;
  window.location.href = HAL_AUTH_URL;
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
    if (status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:logout"));
      }
      return Promise.reject(new Error("Sesión expirada. Inicia sesión de nuevo."));
    }
    const msg =
      error?.response?.data?.error || error?.message || "Error en la solicitud";
    return Promise.reject(new Error(msg));
  }
);

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

export async function fetchConvocatoria(uuid: string): Promise<Convocatoria> {
  const { data } = await http.get<{ convocatoria: Convocatoria }>(
    `/admin/convocatorias/${encodeURIComponent(uuid)}`
  );
  return data.convocatoria;
}

export async function crearConvocatoria(
  input: ConvocatoriaInput
): Promise<string> {
  const { data } = await http.post<{ uuid?: string; slug?: string }>(
    "/admin/convocatorias",
    input
  );
  return data.uuid ?? data.slug ?? "";
}

export async function actualizarConvocatoria(
  uuid: string,
  input: ConvocatoriaInput
): Promise<void> {
  await http.put(`/admin/convocatorias/${encodeURIComponent(uuid)}`, input);
}

export async function eliminarConvocatoria(uuid: string): Promise<void> {
  await http.delete(`/admin/convocatorias/${encodeURIComponent(uuid)}`);
}

export async function registrarArchivo(
  uuid: string,
  meta: { etiqueta: string; nombre: string; ext: string; tamano: number }
): Promise<number> {
  const { data } = await http.post<{ id: number }>(
    `/admin/convocatorias/${encodeURIComponent(uuid)}/archivos`,
    meta
  );
  return data.id;
}

export async function eliminarArchivo(uuid: string, id: number): Promise<void> {
  await http.delete(
    `/admin/convocatorias/${encodeURIComponent(uuid)}/archivos/${id}`
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

// Cliente REST genérico para utilidades internas del módulo.
export const api = {
  async get(url: string, config?: any) {
    const { data } = await http.get(url, config);
    return data;
  },

  async post(url: string, payload?: any, config?: any) {
    const { data } = await http.post(url, payload, config);
    return data;
  },

  async put(url: string, payload?: any, config?: any) {
    const { data } = await http.put(url, payload, config);
    return data;
  },

  async delete(url: string, config?: any) {
    const { data } = await http.delete(url, config);
    return data;
  },
};

export default http;
