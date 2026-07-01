// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import GestorArchivos from "@/components/GestorArchivos";
import type { Convocatoria } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  subirArchivo: vi.fn(),
  registrarArchivo: vi.fn(),
  eliminarArchivo: vi.fn(),
  eliminarArchivoFisico: vi.fn(),
}));

const conv = (over: Partial<Convocatoria> = {}): Convocatoria => ({
  slug: "conv-1",
  title: "T",
  area: "CAS",
  date: "2026-01-01",
  status: "Abierta",
  description: "d",
  publicado: true,
  cuerpo: "",
  files: [
    { id: 1, name: "bases.pdf", label: "Bases", ext: "pdf", size: 2048, href: "/x/bases.pdf" },
  ],
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("GestorArchivos", () => {
  it("muestra el formulario de subida y el listado de documentos", () => {
    render(<GestorArchivos convocatoria={conv()} onCambio={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Subir" })).toBeInTheDocument();
    const enlace = screen.getByRole("link", { name: "Bases" });
    expect(enlace).toHaveAttribute("href", "/x/bases.pdf");
    expect(screen.getByTitle("Eliminar archivo")).toBeInTheDocument();
  });

  it("muestra 'Sin documentos' cuando no hay archivos", () => {
    render(<GestorArchivos convocatoria={conv({ files: [] })} onCambio={vi.fn()} />);
    expect(screen.getByText("Sin documentos todavía.")).toBeInTheDocument();
  });

  it("en solo lectura oculta la subida y el borrado pero deja ver los archivos", () => {
    render(
      <GestorArchivos convocatoria={conv()} onCambio={vi.fn()} soloLectura />
    );
    expect(screen.queryByRole("button", { name: "Subir" })).not.toBeInTheDocument();
    expect(screen.queryByTitle("Eliminar archivo")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bases" })).toBeInTheDocument();
  });
});
