// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FormularioConvocatoria from "@/components/FormularioConvocatoria";
import type { ConvocatoriaInput } from "@/lib/types";

const form: ConvocatoriaInput = {
  titulo: "Mi convocatoria",
  area: "CAS",
  fecha_publicacion: "2026-02-01",
  estado: "Abierta",
  descripcion: "desc",
  cuerpo: "cuerpo",
  publicado: true,
};

describe("FormularioConvocatoria", () => {
  it("refleja los valores del formulario", () => {
    render(
      <FormularioConvocatoria
        form={form}
        esNueva={false}
        soloLectura={false}
        guardando={false}
        onCampo={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue("Mi convocatoria")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-02-01")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardar cambios" })
    ).toBeInTheDocument();
  });

  it("muestra 'Crear convocatoria' cuando es nueva", () => {
    render(
      <FormularioConvocatoria
        form={form}
        esNueva={true}
        soloLectura={false}
        guardando={false}
        onCampo={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(
      screen.getByRole("button", { name: "Crear convocatoria" })
    ).toBeInTheDocument();
  });

  it("notifica los cambios de cada campo vía onCampo", () => {
    const onCampo = vi.fn();
    render(
      <FormularioConvocatoria
        form={form}
        esNueva={false}
        soloLectura={false}
        guardando={false}
        onCampo={onCampo}
        onSubmit={vi.fn()}
      />
    );
    fireEvent.change(screen.getByDisplayValue("Mi convocatoria"), {
      target: { value: "Nuevo título" },
    });
    expect(onCampo).toHaveBeenCalledWith("titulo", "Nuevo título");
  });

  it("dispara onSubmit al enviar el formulario", () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(
      <FormularioConvocatoria
        form={form}
        esNueva={false}
        soloLectura={false}
        guardando={false}
        onCampo={vi.fn()}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("en solo lectura deshabilita los campos y oculta el botón", () => {
    render(
      <FormularioConvocatoria
        form={form}
        esNueva={false}
        soloLectura={true}
        guardando={false}
        onCampo={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue("Mi convocatoria")).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Guardar cambios" })
    ).not.toBeInTheDocument();
  });
});
