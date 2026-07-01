import type { FormEvent } from "react";
import type { ConvocatoriaInput, EstadoConvocatoria } from "@/lib/types";
import { AREAS } from "./adminHelpers";

/**
 * Formulario (presentacional) de datos de una convocatoria. Es controlado: el
 * contenedor mantiene `form` y recibe los cambios por `onCampo`. En modo
 * `soloLectura` todos los campos se deshabilitan y se oculta el botón guardar.
 */
export default function FormularioConvocatoria({
  form,
  esNueva,
  soloLectura,
  guardando,
  onCampo,
  onSubmit,
}: {
  form: ConvocatoriaInput;
  esNueva: boolean;
  soloLectura: boolean;
  guardando: boolean;
  onCampo: <K extends keyof ConvocatoriaInput>(
    campo: K,
    valor: ConvocatoriaInput[K]
  ) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <form className="panel-card" onSubmit={onSubmit} noValidate>
      <label className="campo">
        <span>Título</span>
        <input
          type="text"
          value={form.titulo}
          onChange={(e) => onCampo("titulo", e.target.value)}
          maxLength={200}
          required
          disabled={soloLectura}
        />
      </label>

      <div className="fila">
        <label className="campo">
          <span>Área / Tipo</span>
          <input
            type="text"
            list="areas-sugeridas"
            value={form.area}
            onChange={(e) => onCampo("area", e.target.value)}
            maxLength={60}
            required
            disabled={soloLectura}
          />
          <datalist id="areas-sugeridas">
            {AREAS.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </label>

        <label className="campo">
          <span>Fecha de publicación</span>
          <input
            type="date"
            value={form.fecha_publicacion}
            onChange={(e) => onCampo("fecha_publicacion", e.target.value)}
            required
            disabled={soloLectura}
          />
        </label>

        <label className="campo">
          <span>Estado</span>
          <select
            value={form.estado}
            onChange={(e) =>
              onCampo("estado", e.target.value as EstadoConvocatoria)
            }
            disabled={soloLectura}
          >
            <option value="Abierta">Abierta</option>
            <option value="Cerrada">Cerrada</option>
          </select>
        </label>
      </div>

      <label className="campo">
        <span>Descripción</span>
        <textarea
          rows={3}
          value={form.descripcion}
          onChange={(e) => onCampo("descripcion", e.target.value)}
          maxLength={1000}
          disabled={soloLectura}
        />
      </label>

      <label className="campo">
        <span>Cuerpo (detalle, opcional)</span>
        <textarea
          rows={5}
          value={form.cuerpo}
          onChange={(e) => onCampo("cuerpo", e.target.value)}
          disabled={soloLectura}
        />
      </label>

      <div className="fila fila--acciones">
        <label className="campo campo--check">
          <input
            type="checkbox"
            checked={form.publicado}
            onChange={(e) => onCampo("publicado", e.target.checked)}
            disabled={soloLectura}
          />
          <span>Publicada (visible en el sitio)</span>
        </label>
        {!soloLectura && (
          <button type="submit" className="boton" disabled={guardando}>
            {guardando
              ? "Guardando…"
              : esNueva
                ? "Crear convocatoria"
                : "Guardar cambios"}
          </button>
        )}
      </div>
    </form>
  );
}
