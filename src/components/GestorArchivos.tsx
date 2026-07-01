"use client";

import { useState, type FormEvent } from "react";
import {
  eliminarArchivo,
  eliminarArchivoFisico,
  registrarArchivo,
  subirArchivo,
} from "@/lib/api";
import type { Convocatoria } from "@/lib/types";
import { EXT_ACEPTADAS, formatearBytes, type Mensaje } from "./adminHelpers";
import Aviso from "./Aviso";
import ModalConfirmar, { type ConfirmacionState } from "./ModalConfirmar";

/**
 * Gestor de documentos de una convocatoria: sube el binario directamente al
 * servicio de archivos y registra/borra el metadato en la API. En modo
 * `soloLectura` (convocatoria cerrada) los documentos solo se pueden ver.
 */
export default function GestorArchivos({
  convocatoria,
  onCambio,
  soloLectura = false,
}: {
  convocatoria: Convocatoria;
  onCambio: () => Promise<void> | void;
  soloLectura?: boolean;
}) {
  const slug = convocatoria.slug;
  const [archivo, setArchivo] = useState<File | null>(null);
  const [etiqueta, setEtiqueta] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [mensaje, setMensaje] = useState<Mensaje>(null);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionState | null>(null);

  async function subir(e: FormEvent) {
    e.preventDefault();
    if (!archivo) {
      setMensaje({ texto: "Selecciona un archivo.", tipo: "error" });
      return;
    }
    setSubiendo(true);
    setProgreso(0);
    setMensaje(null);
    try {
      // 1) Sube el binario directamente al servicio de archivos.
      const res = await subirArchivo(slug, archivo, (p) => setProgreso(p));
      // 2) Registra el metadato en la API. Si falla, revierte el huérfano.
      try {
        await registrarArchivo(slug, {
          etiqueta: etiqueta.trim() || archivo.name,
          nombre: res.nombre,
          ext: res.ext,
          tamano: res.tamano,
        });
      } catch (err) {
        await eliminarArchivoFisico(slug, res.nombre).catch(() => undefined);
        throw err;
      }
      setArchivo(null);
      setEtiqueta("");
      const input = document.getElementById(
        "archivo-input"
      ) as HTMLInputElement | null;
      if (input) input.value = "";
      setMensaje({ texto: "Archivo subido.", tipo: "ok" });
      await onCambio();
    } catch (err) {
      setMensaje({ texto: (err as Error).message, tipo: "error" });
    } finally {
      setSubiendo(false);
      setProgreso(0);
    }
  }

  async function borrar(id: number, label: string) {
    setConfirmacion({
      titulo: "Eliminar documento",
      mensaje: `¿Eliminar el archivo "${label}"? Esta acción no se puede deshacer.`,
      onConfirmar: async () => {
        try {
          await eliminarArchivo(slug, id);
          setMensaje({ texto: "Archivo eliminado.", tipo: "ok" });
          await onCambio();
        } catch (err) {
          setMensaje({ texto: (err as Error).message, tipo: "error" });
        }
      },
    });
  }

  return (
    <div className="panel-card" style={{ marginTop: "1rem" }}>
      <div className="seccion-head">
        <div>
          <h3>Documentos</h3>
          <p className="seccion-sub">
            Bases, comunicados, resultados… (PDF, JPG o PNG).
          </p>
        </div>
      </div>

      <Aviso mensaje={mensaje} />

      {!soloLectura && (
        <form className="fila fila--acciones" onSubmit={subir}>
          <label className="campo">
            <span>Etiqueta (nombre visible)</span>
            <input
              type="text"
              value={etiqueta}
              onChange={(e) => setEtiqueta(e.target.value)}
              placeholder="Ej. Bases del proceso"
              maxLength={200}
            />
          </label>
          <label className="campo">
            <span>Archivo</span>
            <input
              id="archivo-input"
              type="file"
              accept={EXT_ACEPTADAS}
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            />
          </label>
          <button type="submit" className="boton boton--sm" disabled={subiendo}>
            {subiendo ? "Subiendo…" : "Subir"}
          </button>
        </form>
      )}

      {subiendo && (
        <div className="subida-progreso">
          <div className="subida-progreso__cab">
            <strong>{archivo?.name ?? "Archivo"}</strong>
            <span>{progreso < 100 ? `${progreso}%` : "Procesando…"}</span>
          </div>
          <div className="barra-progreso">
            <div
              className={
                "barra-progreso__relleno" +
                (progreso >= 100 ? " barra-progreso__relleno--indeterminado" : "")
              }
              style={progreso < 100 ? { width: `${progreso}%` } : undefined}
            />
          </div>
        </div>
      )}

      {convocatoria.files.length === 0 ? (
        <p className="seccion-sub" style={{ marginTop: "0.75rem" }}>
          Sin documentos todavía.
        </p>
      ) : (
        <div style={{ marginTop: "0.75rem" }}>
          {convocatoria.files.map((f) => (
            <div key={f.id} className="area-item__head">
              <div style={{ flex: 1, minWidth: 0 }}>
                <a
                  href={f.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#047857", fontWeight: 600 }}
                >
                  {f.label}
                </a>
                <div className="area-nota">
                  {f.ext.toUpperCase()} · {formatearBytes(f.size)}
                </div>
              </div>
              {!soloLectura && (
                <button
                  type="button"
                  className="boton-icono"
                  title="Eliminar archivo"
                  onClick={() => borrar(f.id, f.label)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <ModalConfirmar
        estado={confirmacion}
        onCerrar={() => setConfirmacion(null)}
      />
    </div>
  );
}
