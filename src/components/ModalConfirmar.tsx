"use client";

import { useEffect, useState } from "react";

/** Estado de una confirmación pendiente para el modal. */
export interface ConfirmacionState {
  titulo: string;
  mensaje: string;
  etiquetaConfirmar?: string;
  onConfirmar: () => void | Promise<void>;
}

/**
 * Modal de confirmación reutilizable. Se muestra cuando `estado` no es null y
 * ejecuta `onConfirmar` al aceptar. Cierra con Escape o clic en el fondo.
 */
export default function ModalConfirmar({
  estado,
  onCerrar,
}: {
  estado: ConfirmacionState | null;
  onCerrar: () => void;
}) {
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (!estado) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [estado, onCerrar]);

  if (!estado) return null;

  async function confirmar() {
    setProcesando(true);
    try {
      await estado!.onConfirmar();
      onCerrar();
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__icono">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
          </svg>
        </div>
        <h3 className="modal__titulo">{estado.titulo}</h3>
        <p className="modal__texto">{estado.mensaje}</p>
        <div className="modal__acciones">
          <button
            type="button"
            className="boton boton--secundario boton--sm"
            onClick={onCerrar}
            disabled={procesando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="boton boton--peligro boton--sm"
            onClick={confirmar}
            disabled={procesando}
          >
            {procesando ? "Eliminando…" : estado.etiquetaConfirmar ?? "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
