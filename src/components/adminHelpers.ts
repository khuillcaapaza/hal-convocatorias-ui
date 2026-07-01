import type { ConvocatoriaInput } from "@/lib/types";

/** Áreas/tipos sugeridos en el formulario. */
export const AREAS = ["CAS", "Reemplazo", "Nombramiento", "Ascenso", "General"];

/** Extensiones aceptadas al adjuntar documentos. */
export const EXT_ACEPTADAS = ".pdf,.jpg,.jpeg,.png";

/** Convocatorias por página en el listado. */
export const POR_PAGINA = 9;

/** Aviso mostrado al usuario (éxito o error), o null si no hay ninguno. */
export type Mensaje = { texto: string; tipo: "ok" | "error" } | null;

/** Valores por defecto del formulario de una convocatoria nueva. */
export function formInicial(): ConvocatoriaInput {
  return {
    titulo: "",
    area: "CAS",
    fecha_publicacion: "",
    estado: "Abierta",
    descripcion: "",
    cuerpo: "",
    publicado: true,
  };
}

/** Formatea un tamaño en bytes a una cadena legible (B, KB, MB, GB). */
export function formatearBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}
