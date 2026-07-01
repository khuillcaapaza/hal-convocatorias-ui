// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminPanel from "@/components/AdminPanel";
import type { Usuario } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  fetchConvocatorias: vi.fn(),
  eliminarConvocatoria: vi.fn(),
  fetchConvocatoria: vi.fn(),
  crearConvocatoria: vi.fn(),
  actualizarConvocatoria: vi.fn(),
  subirArchivo: vi.fn(),
  registrarArchivo: vi.fn(),
  eliminarArchivo: vi.fn(),
  eliminarArchivoFisico: vi.fn(),
}));

import { fetchConvocatorias, fetchConvocatoria } from "@/lib/api";

const usuario: Usuario = { usuario: "ana", nombre: "Ana", rol: "admin" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchConvocatorias).mockResolvedValue([]);
  window.history.pushState(null, "", "/");
});

describe("AdminPanel", () => {
  it("muestra el saludo del usuario y el listado por defecto", async () => {
    render(<AdminPanel usuario={usuario} onLogout={vi.fn()} />);
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(
      await screen.findByText("Aún no hay convocatorias. Crea la primera.")
    ).toBeInTheDocument();
  });

  it("abre el editor de una nueva y refleja el estado en la URL", async () => {
    const user = userEvent.setup();
    render(<AdminPanel usuario={usuario} onLogout={vi.fn()} />);
    await screen.findByText("Aún no hay convocatorias. Crea la primera.");

    await user.click(
      screen.getByRole("button", { name: "+ Nueva convocatoria" })
    );
    expect(screen.getByText("Nueva convocatoria")).toBeInTheDocument();
    expect(window.location.search).toBe("?nuevo=1");
  });

  it("abre en modo editor cuando la URL trae ?editar=<slug>", async () => {
    vi.mocked(fetchConvocatoria).mockResolvedValue({
      slug: "conv-1",
      title: "Convocatoria Uno",
      area: "CAS",
      date: "2026-01-01",
      status: "Abierta",
      description: "d",
      publicado: true,
      cuerpo: "",
      files: [],
    });
    window.history.pushState(null, "", "/?editar=conv-1");
    render(<AdminPanel usuario={usuario} onLogout={vi.fn()} />);
    // El editor pide los datos de la convocatoria indicada en la URL.
    await waitFor(() =>
      expect(fetchConvocatoria).toHaveBeenCalledWith("conv-1")
    );
  });

  it("cierra sesión con el botón Salir", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(<AdminPanel usuario={usuario} onLogout={onLogout} />);
    await user.click(screen.getByRole("button", { name: "Salir" }));
    expect(onLogout).toHaveBeenCalled();
  });
});
