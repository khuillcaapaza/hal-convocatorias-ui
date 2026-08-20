"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  actualizarConvocatoria,
  crearConvocatoria,
  fetchConvocatoria,
} from "@/lib/api";
import type { Convocatoria, ConvocatoriaInput } from "@/lib/types";
import { formInicial, type Mensaje } from "./adminHelpers";
import Aviso from "./Aviso";
import FormularioConvocatoria from "./FormularioConvocatoria";
import GestorArchivos from "./GestorArchivos";

/**
 * Editor de una convocatoria. Carga los datos (salvo si es nueva), delega la
 * captura en `FormularioConvocatoria` y la gestión de documentos en
 * `GestorArchivos`. Una convocatoria cerrada es de solo lectura.
 */
export default function EditorConvocatoria({
  slug,
  onVolver,
  onCreada,
}: {
  slug: string; // "" = nueva
  onVolver: () => void;
  onCreada: (uuid: string) => void;
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

  // Una convocatoria cerrada es de solo lectura: se puede ver pero no editar.
  const soloLectura = !esNueva && convocatoria?.status === "Cerrada";

  function set<K extends keyof ConvocatoriaInput>(
    campo: K,
    valor: ConvocatoriaInput[K]
  ) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (soloLectura) return; // convocatoria cerrada: solo lectura
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
        const nuevoUuid = await crearConvocatoria(form);
        setMensaje({
          texto: "Convocatoria creada. Ya puedes añadir archivos.",
          tipo: "ok",
        });
        onCreada(nuevoUuid); // pasa a modo edición del nuevo UUID
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
        <h2>
          {esNueva
            ? "Nueva convocatoria"
            : soloLectura
              ? "Ver convocatoria"
              : "Editar convocatoria"}
        </h2>
      </div>

      {soloLectura && (
        <p className="aviso">
          Esta convocatoria está <strong>cerrada</strong>: solo se puede
          visualizar. Para editarla o modificar sus documentos, primero debe
          reabrirse.
        </p>
      )}

      <Aviso mensaje={mensaje} />

      {cargando ? (
        <p className="cargando">Cargando…</p>
      ) : (
        <>
          <FormularioConvocatoria
            form={form}
            esNueva={esNueva}
            soloLectura={Boolean(soloLectura)}
            guardando={guardando}
            onCampo={set}
            onSubmit={guardar}
          />

          {esNueva ? (
            <p className="seccion-sub" style={{ marginTop: "1rem" }}>
              Guarda la convocatoria para poder adjuntar documentos.
            </p>
          ) : (
            convocatoria && (
              <GestorArchivos
                convocatoria={convocatoria}
                onCambio={cargar}
                soloLectura={Boolean(soloLectura)}
              />
            )
          )}
        </>
      )}
    </section>
  );
}
