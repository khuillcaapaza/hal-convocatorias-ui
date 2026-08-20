"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { eliminarConvocatoria, fetchConvocatorias } from "@/lib/api";
import type { ConvocatoriaMeta } from "@/lib/types";
import { POR_PAGINA, type Mensaje } from "./adminHelpers";
import Aviso from "./Aviso";
import BarraBusqueda from "./BarraBusqueda";
import ConvocatoriaCard from "./ConvocatoriaCard";
import ModalConfirmar, { type ConfirmacionState } from "./ModalConfirmar";
import Paginacion from "./Paginacion";

/**
 * Listado de convocatorias con búsqueda, paginación y borrado. Las cerradas no
 * se pueden eliminar.
 */
export default function ListaConvocatorias({
  onNueva,
  onEditar,
}: {
  onNueva: () => void;
  onEditar: (uuid: string) => void;
}) {
  const [items, setItems] = useState<ConvocatoriaMeta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<Mensaje>(null);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionState | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setItems(await fetchConvocatorias());
      setMensaje(null);
    } catch (err) {
      setMensaje({ texto: (err as Error).message, tipo: "error" });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) =>
      `${c.title} ${c.area} ${c.description}`.toLowerCase().includes(q)
    );
  }, [items, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice(
    (paginaSegura - 1) * POR_PAGINA,
    paginaSegura * POR_PAGINA
  );

  function buscar(texto: string) {
    setBusqueda(texto);
    setPagina(1);
  }

  function eliminar(uuid: string, titulo: string) {
    const conv = items.find((c) => c.uuid === uuid);
    if (conv?.status === "Cerrada") {
      setMensaje({
        texto: "No se pueden eliminar convocatorias cerradas.",
        tipo: "error",
      });
      return;
    }
    setConfirmacion({
      titulo: "Eliminar convocatoria",
      mensaje: `¿Eliminar la convocatoria "${titulo}" y todos sus archivos? Esta acción no se puede deshacer.`,
      onConfirmar: async () => {
        try {
          await eliminarConvocatoria(uuid);
          setMensaje({ texto: "Convocatoria eliminada.", tipo: "ok" });
          await cargar();
        } catch (err) {
          setMensaje({ texto: (err as Error).message, tipo: "error" });
        }
      },
    });
  }

  return (
    <section>
      <div className="seccion-head">
        <div>
          <h2>Convocatorias</h2>
          <p className="seccion-sub">
            Gestiona los procesos de convocatoria y sus documentos.
          </p>
        </div>
        <button type="button" className="boton boton--sm" onClick={onNueva}>
          + Nueva convocatoria
        </button>
      </div>

      <Aviso mensaje={mensaje} />

      {!cargando && items.length > 0 && (
        <BarraBusqueda
          valor={busqueda}
          onCambio={buscar}
          conteo={filtrados.length}
        />
      )}

      {cargando ? (
        <p className="cargando">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="cargando">Aún no hay convocatorias. Crea la primera.</p>
      ) : filtrados.length === 0 ? (
        <p className="cargando">
          No se encontraron convocatorias para «{busqueda.trim()}».
        </p>
      ) : (
        <>
          <div className="grid-cronogramas">
            {visibles.map((c) => (
              <ConvocatoriaCard
                key={c.uuid || c.slug}
                convocatoria={c}
                onEditar={onEditar}
                onEliminar={eliminar}
              />
            ))}
          </div>

          <Paginacion
            pagina={paginaSegura}
            totalPaginas={totalPaginas}
            onCambio={setPagina}
          />
        </>
      )}
      <ModalConfirmar
        estado={confirmacion}
        onCerrar={() => setConfirmacion(null)}
      />
    </section>
  );
}
