// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConvocatoriaCard from "@/components/ConvocatoriaCard";
import type { ConvocatoriaMeta } from "@/lib/types";

const meta = (over: Partial<ConvocatoriaMeta> = {}): ConvocatoriaMeta => ({
  slug: "conv-1",
  title: "Convocatoria Uno",
  area: "CAS",
  date: "2026-01-01",
  status: "Abierta",
  description: "Una descripción",
  publicado: true,
  ...over,
});

describe("ConvocatoriaCard", () => {
  it("muestra los datos y la acción 'Editar' cuando está abierta", async () => {
    const user = userEvent.setup();
    const onEditar = vi.fn();
    const onEliminar = vi.fn();
    render(
      <ConvocatoriaCard
        convocatoria={meta()}
        onEditar={onEditar}
        onEliminar={onEliminar}
      />
    );

    expect(screen.getByText("Convocatoria Uno")).toBeInTheDocument();
    expect(screen.getByText("CAS")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(onEditar).toHaveBeenCalledWith("conv-1");

    const eliminar = screen.getByRole("button", { name: "Eliminar" });
    expect(eliminar).not.toBeDisabled();
    await user.click(eliminar);
    expect(onEliminar).toHaveBeenCalledWith("conv-1", "Convocatoria Uno");
  });

  it("cerrada: acción 'Ver' y eliminar deshabilitado", () => {
    render(
      <ConvocatoriaCard
        convocatoria={meta({ status: "Cerrada" })}
        onEditar={vi.fn()}
        onEliminar={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Ver" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeDisabled();
  });

  it("marca 'Oculta' cuando no está publicada", () => {
    render(
      <ConvocatoriaCard
        convocatoria={meta({ publicado: false })}
        onEditar={vi.fn()}
        onEliminar={vi.fn()}
      />
    );
    expect(screen.getByText("Oculta")).toBeInTheDocument();
  });
});
