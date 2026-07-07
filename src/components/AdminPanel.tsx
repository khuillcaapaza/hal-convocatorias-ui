"use client";

import { useCallback, useEffect, useState } from "react";
import type { Usuario } from "@/lib/types";
import { IconoConvocatorias } from "./icons";
import ListaConvocatorias from "./ListaConvocatorias";
import EditorConvocatoria from "./EditorConvocatoria";
import { ChangePasswordForm } from "./ChangePasswordForm";

interface Props {
  usuario: Usuario;
  onLogout: () => void;
}

type PrincipalView = "convocatorias" | "settings";

function IconoSeguridad() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/**
 * Shell del panel de administración: barra superior, navegación y enrutado
 * entre el listado y el editor. El estado se refleja en la URL
 * (?view=<seccion> | ?editar=<slug> | ?nuevo=1) mediante la History API.
 */
export default function AdminPanel({ usuario, onLogout }: Props) {
  const [principalView, setPrincipalView] = useState<PrincipalView>("convocatorias");
  const [vista, setVista] = useState<"lista" | "editor">("lista");
  // slug en edición; "" indica una convocatoria nueva (aún no creada).
  const [slugEditando, setSlugEditando] = useState<string | null>(null);

  // Sincroniza el estado con la URL (?view= | ?editar=<slug> | ?nuevo=1) sin recargar.
  const aplicarDesdeUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view === "settings") {
      setPrincipalView(view);
      setSlugEditando(null);
      setVista("lista");
      return;
    }
    // Sección de convocatorias (por defecto).
    setPrincipalView("convocatorias");
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

  function cambiarSeccion(view: PrincipalView) {
    setPrincipalView(view);
    setSlugEditando(null);
    setVista("lista");
    navegar(view === "convocatorias" ? "" : "view=" + view);
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
              className={"nav-item" + (principalView === "convocatorias" ? " nav-item--activo" : "")}
              onClick={() => cambiarSeccion("convocatorias")}
            >
              <IconoConvocatorias />
              Convocatorias
            </button>
            <button
              type="button"
              className={"nav-item" + (principalView === "settings" ? " nav-item--activo" : "")}
              onClick={() => cambiarSeccion("settings")}
            >
              <IconoSeguridad />
              Cambiar Contraseña
            </button>
          </nav>
        </aside>

        <main className="contenido">
          {principalView === "convocatorias" ? (
            vista === "lista" ? (
              <ListaConvocatorias onNueva={nueva} onEditar={editar} />
            ) : (
              <EditorConvocatoria
                slug={slugEditando ?? ""}
                onVolver={volverALista}
                onCreada={editar}
              />
            )
          ) : (
            <ChangePasswordForm />
          )}
        </main>
      </div>
    </div>
  );
}
