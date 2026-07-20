"use client";

import { useCallback, useEffect, useState } from "react";
import type { Usuario } from "@/lib/types";
import { IconoConvocatorias } from "./icons";
import ListaConvocatorias from "./ListaConvocatorias";
import EditorConvocatoria from "./EditorConvocatoria";

interface Props {
  usuario: Usuario;
  onLogout: () => void;
}

/**
 * Shell del panel de administración: barra superior, navegación y enrutado
 * entre el listado y el editor. El estado se refleja en la URL
 * (?editar=<slug> | ?nuevo=1) mediante la History API.
 */
export default function AdminPanel({ usuario, onLogout }: Props) {
  const [vista, setVista] = useState<"lista" | "editor">("lista");
  // slug en edición; "" indica una convocatoria nueva (aún no creada).
  const [slugEditando, setSlugEditando] = useState<string | null>(null);

  // Sincroniza el estado con la URL (?view= | ?editar=<slug> | ?nuevo=1) sin recargar.
  const aplicarDesdeUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("editar");
    if (slug) {
      setSlugEditando(slug);
      setVista("editor");
    } else if (params.get("nuevo")) {
      setSlugEditando("");
      setVista("editor");
    } else {
      setSlugEditando(null);
      setVista("lista");
    }
  }, []);

  // Lee la URL al montar y responde a los botones atrás/adelante del navegador.
  useEffect(() => {
    aplicarDesdeUrl();
    window.addEventListener("popstate", aplicarDesdeUrl);
    return () => window.removeEventListener("popstate", aplicarDesdeUrl);
  }, [aplicarDesdeUrl]);

  const navegar = useCallback((search: string) => {
    const url = window.location.pathname + (search ? `?${search}` : "");
    window.history.pushState(null, "", url);
  }, []);

  function irAConvocatorias() {
    setSlugEditando(null);
    setVista("lista");
    navegar("");
  }

  function nueva() {
    setSlugEditando("");
    setVista("editor");
    navegar("nuevo=1");
  }

  function editar(slug: string) {
    setSlugEditando(slug);
    setVista("editor");
    navegar(`editar=${encodeURIComponent(slug)}`);
  }

  function volverALista() {
    setSlugEditando(null);
    setVista("lista");
    navegar("");
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
            <button
              type="button"
              className="nav-item nav-item--activo"
              onClick={irAConvocatorias}
            >
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
