export interface Usuario {
  usuario: string;
  email?: string;
  nombre?: string;
  rol?: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

/** Respuesta del primer paso del login: se envió un código al email. */
export interface LoginChallenge {
  requiere2fa: true;
  email: string;
  expira_en?: number;
  mensaje?: string;
  /** Solo en modo desarrollo (APP_DEBUG): código para autocompletar. */
  dev_codigo?: string;
}

// ── Convocatorias ──────────────────────────────────────────────────────

export type EstadoConvocatoria = "Abierta" | "Cerrada";

/** Archivo descargable asociado a una convocatoria. */
export interface ConvocatoriaFile {
  id: number;
  name: string;
  label: string;
  ext: string;
  size: number;
  href: string;
}

/** Metadatos de una convocatoria (listados). */
export interface ConvocatoriaMeta {
  slug: string;
  title: string;
  area: string;
  /** Fecha ISO `yyyy-mm-dd`. */
  date: string;
  status: EstadoConvocatoria;
  description: string;
  publicado: boolean;
}

/** Convocatoria completa, con su cuerpo y archivos. */
export interface Convocatoria extends ConvocatoriaMeta {
  cuerpo?: string;
  actualizado?: string | null;
  files: ConvocatoriaFile[];
}

/** Datos del formulario para crear/editar una convocatoria. */
export interface ConvocatoriaInput {
  slug?: string;
  titulo: string;
  area: string;
  fecha_publicacion: string;
  estado: EstadoConvocatoria;
  descripcion: string;
  cuerpo?: string;
  publicado: boolean;
}

/** Resultado de subir un archivo a hal-archivos-api. */
export interface UploadResult {
  ok: boolean;
  slug: string;
  nombre: string;
  ext: string;
  tamano: number;
  url: string;
}
