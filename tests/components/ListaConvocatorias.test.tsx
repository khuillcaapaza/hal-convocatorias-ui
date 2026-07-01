// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListaConvocatorias from "@/components/ListaConvocatorias";
import type { ConvocatoriaMeta } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  fetchConvocatorias: vi.fn(),
  eliminarConvocatoria: vi.fn(),
}));

import { fetchConvocatorias, eliminarConvocatoria } from "@/lib/api";

const meta = (over: Partial<ConvocatoriaMeta> = {}): ConvocatoriaMeta => ({
  slug: "conv-1",
  title: "Convocatoria Uno",
  area: "CAS",
  date: "2026-01-01",
  status: "Abierta",
  description: "primera",
  publicado: true,
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("ListaConvocatorias", () => {
  it("renderiza las convocatorias recibidas de la API", async () => {
    vi.mocked(fetchConvocatorias).mockResolvedValue([
      meta(),
      meta({ slug: "conv-2", title: "Otra convocatoria" }),
    ]);
    render(<ListaConvocatorias onNueva={vi.fn()} onEditar={vi.fn()} />);

    expect(await screen.findByText("Convocatoria Uno")).toBeInTheDocument();
    expect(screen.getByText("Otra convocatoria")).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay convocatorias", async () => {
    vi.mocked(fetchConvocatorias).mockResolvedValue([]);
    render(<ListaConvocatorias onNueva={vi.fn()} onEditar={vi.fn()} />);
    expect(
      await screen.findByText("Aún no hay convocatorias. Crea la primera.")
    ).toBeInTheDocument();
  });

  it("filtra por búsqueda", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchConvocatorias).mockResolvedValue([
      meta(),
      meta({ slug: "conv-2", title: "Otra convocatoria" }),
    ]);
    render(<ListaConvocatorias onNueva={vi.fn()} onEditar={vi.fn()} />);
    await screen.findByText("Convocatoria Uno");

    await user.type(screen.getByRole("searchbox"), "Otra");
    expect(screen.queryByText("Convocatoria Uno")).not.toBeInTheDocument();
    expect(screen.getByText("Otra convocatoria")).toBeInTheDocument();
  });

  it("propaga onNueva y onEditar", async () => {
    const user = userEvent.setup();
    const onNueva = vi.fn();
    const onEditar = vi.fn();
    vi.mocked(fetchConvocatorias).mockResolvedValue([meta()]);
    render(<ListaConvocatorias onNueva={onNueva} onEditar={onEditar} />);
    await screen.findByText("Convocatoria Uno");

    await user.click(screen.getByRole("button", { name: "+ Nueva convocatoria" }));
    expect(onNueva).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(onEditar).toHaveBeenCalledWith("conv-1");
  });

  it("no permite eliminar convocatorias cerradas", async () => {
    vi.mocked(fetchConvocatorias).mockResolvedValue([
      meta({ status: "Cerrada" }),
    ]);
    render(<ListaConvocatorias onNueva={vi.fn()} onEditar={vi.fn()} />);
    await screen.findByText("Convocatoria Uno");

    expect(screen.getByRole("button", { name: "Eliminar" })).toBeDisabled();
    expect(eliminarConvocatoria).not.toHaveBeenCalled();
  });
});
