"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  actualizarConvocatoria,
  crearConvocatoria,
  eliminarArchivo,
  eliminarArchivoFisico,
  eliminarConvocatoria,
  fetchConvocatoria,
  fetchConvocatorias,
  registrarArchivo,
  subirArchivo,
} from "@/lib/api";
import type {
  Convocatoria,
  ConvocatoriaInput,
  ConvocatoriaMeta,
  EstadoConvocatoria,
  Usuario,
} from "@/lib/types";

interface Props {
  usuario: Usuario;
  onLogout: () => void;
}

const AREAS = ["CAS", "Reemplazo", "Nombramiento", "Ascenso", "General"];
const EXT_ACEPTADAS = ".pdf,.jpg,.jpeg,.png";

type Mensaje = { texto: string; tipo: "ok" | "error" } | null;

function IconoConvocatorias() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6M9 9h1" />
    </svg>
  );
}

function formInicial(): ConvocatoriaInput {
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

function formatearBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}

export default function AdminPanel({ usuario, onLogout }: Props) {
  const [vista, setVista] = useState<"lista" | "editor">("lista");
  // slug en edición; "" indica una convocatoria nueva (aún no creada).
  const [slugEditando, setSlugEditando] = useState<string | null>(null);

  function nueva() {
    setSlugEditando("");
    setVista("editor");
  }

  function editar(slug: string) {
    setSlugEditando(slug);
    setVista("editor");
  }

  function volverALista() {
    setSlugEditando(null);
    setVista("lista");
  }

  return (
    <div className="panel">
      <header className="topbar">
        <div className="topbar__brand">
          <strong>Sistema de Convocatorias</strong>
          <span>Hospital Antonio Lorena</span>
        </div>
        <div className="topbar__user">
          <span>
            Hola, <strong>{usuario.nombre || usuario.usuario}</strong>
            {usuario.rol ? ` (${usuario.rol})` : ""}
          </span>
          <button
            type="button"
            className="boton boton--secundario boton--sm"
            onClick={onLogout}
          >
            Salir
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav>
            <button type="button" className="nav-item nav-item--activo">
              <IconoConvocatorias />
              Convocatorias
            </button>
          </nav>
        </aside>

        <main className="contenido">
          {vista === "lista" ? (
            <ListaConvocatorias onNueva={nueva} onEditar={editar} />
          ) : (
            <EditorConvocatoria
              slug={slugEditando ?? ""}
              onVolver={volverALista}
              onCreada={editar}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ── Lista ────────────────────────────────────────────────────────────

function ListaConvocatorias({
  onNueva,
  onEditar,
}: {
  onNueva: () => void;
  onEditar: (slug: string) => void;
}) {
  const [items, setItems] = useState<ConvocatoriaMeta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<Mensaje>(null);

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

  async function borrar(slug: string, titulo: string) {
    if (!window.confirm(`¿Eliminar la convocatoria "${titulo}" y sus archivos?`))
      return;
    try {
      await eliminarConvocatoria(slug);
      setMensaje({ texto: "Convocatoria eliminada.", tipo: "ok" });
      await cargar();
    } catch (err) {
      setMensaje({ texto: (err as Error).message, tipo: "error" });
    }
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

      {mensaje && (
        <p className={"aviso" + (mensaje.tipo === "error" ? " aviso--error" : "")}>
          {mensaje.texto}
        </p>
      )}

      {cargando ? (
        <p className="cargando">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="cargando">Aún no hay convocatorias. Crea la primera.</p>
      ) : (
        <div className="grid-cronogramas">
          {items.map((c) => (
            <article key={c.slug} className="cron-card">
              <div className="cron-card__top">
                <span className="cron-card__mes">{c.date}</span>
                <span
                  className={
                    "chip " + (c.status === "Abierta" ? "chip--ok" : "chip--off")
                  }
                >
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
                  Editar
                </button>
                <button
                  type="button"
                  className="boton boton--peligro boton--sm"
                  onClick={() => borrar(c.slug, c.title)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Editor ───────────────────────────────────────────────────────────

function EditorConvocatoria({
  slug,
  onVolver,
  onCreada,
}: {
  slug: string; // "" = nueva
  onVolver: () => void;
  onCreada: (slug: string) => void;
}) {
  const esNueva = slug === "";
  const [form, setForm] = useState<ConvocatoriaInput>(formInicial());
  const [convocatoria, setConvocatoria] = useState<Convocatoria | null>(null);
  const [cargando, setCargando] = useState(!esNueva);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje>(null);

  const cargar = useCallback(async () => {
    if (esNueva) return;
    setCargando(true);
    try {
      const c = await fetchConvocatoria(slug);
      setConvocatoria(c);
      setForm({
        titulo: c.title,
        area: c.area,
        fecha_publicacion: c.date,
        estado: c.status,
        descripcion: c.description,
        cuerpo: c.cuerpo ?? "",
        publicado: c.publicado,
      });
      setMensaje(null);
    } catch (err) {
      setMensaje({ texto: (err as Error).message, tipo: "error" });
    } finally {
      setCargando(false);
    }
  }, [slug, esNueva]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function set<K extends keyof ConvocatoriaInput>(
    campo: K,
    valor: ConvocatoriaInput[K]
  ) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) {
      setMensaje({ texto: "El título es obligatorio.", tipo: "error" });
      return;
    }
    if (!form.fecha_publicacion) {
      setMensaje({
        texto: "La fecha de publicación es obligatoria.",
        tipo: "error",
      });
      return;
    }
    setGuardando(true);
    try {
      if (esNueva) {
        const nuevoSlug = await crearConvocatoria(form);
        setMensaje({
          texto: "Convocatoria creada. Ya puedes añadir archivos.",
          tipo: "ok",
        });
        onCreada(nuevoSlug); // pasa a modo edición del nuevo slug
      } else {
        await actualizarConvocatoria(slug, form);
        setMensaje({ texto: "Cambios guardados.", tipo: "ok" });
        await cargar();
      }
    } catch (err) {
      setMensaje({ texto: (err as Error).message, tipo: "error" });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section>
      <button type="button" className="link-volver" onClick={onVolver}>
        ← Volver a la lista
      </button>

      <div className="seccion-head">
        <h2>{esNueva ? "Nueva convocatoria" : "Editar convocatoria"}</h2>
      </div>

      {mensaje && (
        <p className={"aviso" + (mensaje.tipo === "error" ? " aviso--error" : "")}>
          {mensaje.texto}
        </p>
      )}

      {cargando ? (
        <p className="cargando">Cargando…</p>
      ) : (
        <>
          <form className="panel-card" onSubmit={guardar} noValidate>
            <label className="campo">
              <span>Título</span>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => set("titulo", e.target.value)}
                maxLength={200}
                required
              />
            </label>

            <div className="fila">
              <label className="campo">
                <span>Área / Tipo</span>
                <input
                  type="text"
                  list="areas-sugeridas"
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                  maxLength={60}
                  required
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
                  onChange={(e) => set("fecha_publicacion", e.target.value)}
                  required
                />
              </label>

              <label className="campo">
                <span>Estado</span>
                <select
                  value={form.estado}
                  onChange={(e) =>
                    set("estado", e.target.value as EstadoConvocatoria)
                  }
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
                onChange={(e) => set("descripcion", e.target.value)}
                maxLength={1000}
              />
            </label>

            <label className="campo">
              <span>Cuerpo (detalle, opcional)</span>
              <textarea
                rows={5}
                value={form.cuerpo}
                onChange={(e) => set("cuerpo", e.target.value)}
              />
            </label>

            <div className="fila fila--acciones">
              <label className="campo campo--check">
                <input
                  type="checkbox"
                  checked={form.publicado}
                  onChange={(e) => set("publicado", e.target.checked)}
                />
                <span>Publicada (visible en el sitio)</span>
              </label>
              <button type="submit" className="boton" disabled={guardando}>
                {guardando
                  ? "Guardando…"
                  : esNueva
                    ? "Crear convocatoria"
                    : "Guardar cambios"}
              </button>
            </div>
          </form>

          {esNueva ? (
            <p className="seccion-sub" style={{ marginTop: "1rem" }}>
              Guarda la convocatoria para poder adjuntar documentos.
            </p>
          ) : (
            convocatoria && (
              <GestorArchivos convocatoria={convocatoria} onCambio={cargar} />
            )
          )}
        </>
      )}
    </section>
  );
}

// ── Gestor de archivos ───────────────────────────────────────────────

function GestorArchivos({
  convocatoria,
  onCambio,
}: {
  convocatoria: Convocatoria;
  onCambio: () => Promise<void> | void;
}) {
  const slug = convocatoria.slug;
  const [archivo, setArchivo] = useState<File | null>(null);
  const [etiqueta, setEtiqueta] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje>(null);

  async function subir(e: FormEvent) {
    e.preventDefault();
    if (!archivo) {
      setMensaje({ texto: "Selecciona un archivo.", tipo: "error" });
      return;
    }
    setSubiendo(true);
    setMensaje(null);
    try {
      // 1) Sube el binario directamente al servicio de archivos.
      const res = await subirArchivo(slug, archivo);
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
    }
  }

  async function borrar(id: number, label: string) {
    if (!window.confirm(`¿Eliminar el archivo "${label}"?`)) return;
    try {
      await eliminarArchivo(slug, id);
      setMensaje({ texto: "Archivo eliminado.", tipo: "ok" });
      await onCambio();
    } catch (err) {
      setMensaje({ texto: (err as Error).message, tipo: "error" });
    }
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

      {mensaje && (
        <p className={"aviso" + (mensaje.tipo === "error" ? " aviso--error" : "")}>
          {mensaje.texto}
        </p>
      )}

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
              <button
                type="button"
                className="boton-icono"
                title="Eliminar archivo"
                onClick={() => borrar(f.id, f.label)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
