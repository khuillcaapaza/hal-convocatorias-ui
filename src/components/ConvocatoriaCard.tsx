import type { ConvocatoriaMeta } from "@/lib/types";

/**
 * Tarjeta de una convocatoria en el listado. Las convocatorias cerradas se
 * pueden ver pero no eliminar (el botón de acción cambia a "Ver").
 */
export default function ConvocatoriaCard({
  convocatoria,
  onEditar,
  onEliminar,
}: {
  convocatoria: ConvocatoriaMeta;
  onEditar: (slug: string) => void;
  onEliminar: (slug: string, titulo: string) => void;
}) {
  const c = convocatoria;
  const cerrada = c.status === "Cerrada";

  return (
    <article className="cron-card">
      <div className="cron-card__top">
        <span className="cron-card__mes">{c.date}</span>
        <span className={"chip " + (cerrada ? "chip--off" : "chip--ok")}>
          {c.status}
        </span>
      </div>
      <h3>{c.title}</h3>
      <p>{c.description}</p>
      <div className="cron-card__top" style={{ marginBottom: "0.6rem" }}>
        <span className="dia-pill">{c.area}</span>
        {!c.publicado && <span className="chip chip--off">Oculta</span>}
      </div>
      <div className="cron-card__acciones">
        <button
          type="button"
          className="boton boton--ghost boton--sm"
          onClick={() => onEditar(c.slug)}
        >
          {cerrada ? "Ver" : "Editar"}
        </button>
        <button
          type="button"
          className="boton boton--peligro boton--sm"
          onClick={() => onEliminar(c.slug, c.title)}
          disabled={cerrada}
          title={
            cerrada
              ? "No se pueden eliminar convocatorias cerradas"
              : "Eliminar convocatoria"
          }
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}
