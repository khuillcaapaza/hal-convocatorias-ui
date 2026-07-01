// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditorConvocatoria from "@/components/EditorConvocatoria";
import type { Convocatoria } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  fetchConvocatoria: vi.fn(),
  crearConvocatoria: vi.fn(),
  actualizarConvocatoria: vi.fn(),
  // usadas por GestorArchivos (hijo)
  subirArchivo: vi.fn(),
  registrarArchivo: vi.fn(),
  eliminarArchivo: vi.fn(),
  eliminarArchivoFisico: vi.fn(),
}));

import {
  fetchConvocatoria,
  crearConvocatoria,
  actualizarConvocatoria,
} from "@/lib/api";

const conv = (over: Partial<Convocatoria> = {}): Convocatoria => ({
  slug: "conv-1",
  title: "Convocatoria Uno",
  area: "CAS",
  date: "2026-01-01",
  status: "Abierta",
  description: "desc",
  publicado: true,
  cuerpo: "cuerpo",
  files: [],
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("EditorConvocatoria", () => {
  it("modo nuevo: formulario vacío y crea al guardar", async () => {
    const user = userEvent.setup();
    const onCreada = vi.fn();
    vi.mocked(crearConvocatoria).mockResolvedValue("nuevo-slug");
    render(
      <EditorConvocatoria slug="" onVolver={vi.fn()} onCreada={onCreada} />
    );

    expect(screen.getByText("Nueva convocatoria")).toBeInTheDocument();
    expect(fetchConvocatoria).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("textbox", { name: /Título/i }), {
      target: { value: "Un título" },
    });
    // La fecha no tiene rol textbox; se localiza por valor inicial vacío.
    const fecha = document.querySelector(
      'input[type="date"]'
    ) as HTMLInputElement;
    fireEvent.change(fecha, { target: { value: "2026-03-01" } });

    await user.click(screen.getByRole("button", { name: "Crear convocatoria" }));
    await waitFor(() => expect(crearConvocatoria).toHaveBeenCalled());
    expect(onCreada).toHaveBeenCalledWith("nuevo-slug");
  });

  it("carga una convocatoria existente y guarda cambios", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchConvocatoria).mockResolvedValue(conv());
    vi.mocked(actualizarConvocatoria).mockResolvedValue(undefined as never);
    render(
      <EditorConvocatoria slug="conv-1" onVolver={vi.fn()} onCreada={vi.fn()} />
    );

    expect(
      await screen.findByDisplayValue("Convocatoria Uno")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() =>
      expect(actualizarConvocatoria).toHaveBeenCalledWith(
        "conv-1",
        expect.objectContaining({ titulo: "Convocatoria Uno" })
      )
    );
  });

  it("una convocatoria cerrada es de solo lectura", async () => {
    vi.mocked(fetchConvocatoria).mockResolvedValue(conv({ status: "Cerrada" }));
    render(
      <EditorConvocatoria slug="conv-1" onVolver={vi.fn()} onCreada={vi.fn()} />
    );

    expect(await screen.findByText("Ver convocatoria")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Convocatoria Uno")).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Guardar cambios" })
    ).not.toBeInTheDocument();
  });

  it("vuelve a la lista al pulsar el enlace", async () => {
    const user = userEvent.setup();
    const onVolver = vi.fn();
    render(
      <EditorConvocatoria slug="" onVolver={onVolver} onCreada={vi.fn()} />
    );
    await user.click(screen.getByRole("button", { name: /Volver a la lista/i }));
    expect(onVolver).toHaveBeenCalled();
  });
});
