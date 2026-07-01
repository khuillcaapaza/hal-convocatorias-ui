/**
 * Controles de paginación reutilizables. No renderiza nada si hay una sola
 * página.
 */
export default function Paginacion({
  pagina,
  totalPaginas,
  onCambio,
}: {
  pagina: number;
  totalPaginas: number;
  onCambio: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="paginacion">
      <button
        type="button"
        className="pag-btn"
        onClick={() => onCambio(Math.max(1, pagina - 1))}
        disabled={pagina === 1}
      >
        ‹
      </button>
      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          className={"pag-btn" + (p === pagina ? " pag-btn--activo" : "")}
          onClick={() => onCambio(p)}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className="pag-btn"
        onClick={() => onCambio(Math.min(totalPaginas, pagina + 1))}
        disabled={pagina === totalPaginas}
      >
        ›
      </button>
    </div>
  );
}
