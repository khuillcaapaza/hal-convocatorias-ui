import { IconoBuscar } from "./icons";

/**
 * Barra de búsqueda con contador de resultados. Componente controlado.
 */
export default function BarraBusqueda({
  valor,
  onCambio,
  conteo,
}: {
  valor: string;
  onCambio: (texto: string) => void;
  conteo: number;
}) {
  return (
    <div className="lista-barra">
      <div className="busqueda">
        <IconoBuscar />
        <input
          type="search"
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          placeholder="Buscar por título, área o descripción…"
        />
      </div>
      <span className="lista-conteo">
        {conteo} convocatoria{conteo === 1 ? "" : "s"}
      </span>
    </div>
  );
}
