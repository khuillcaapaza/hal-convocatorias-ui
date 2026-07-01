// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BarraBusqueda from "@/components/BarraBusqueda";

describe("BarraBusqueda", () => {
  it("muestra el conteo en singular", () => {
    render(<BarraBusqueda valor="" onCambio={() => {}} conteo={1} />);
    expect(screen.getByText("1 convocatoria")).toBeInTheDocument();
  });

  it("muestra el conteo en plural", () => {
    render(<BarraBusqueda valor="" onCambio={() => {}} conteo={3} />);
    expect(screen.getByText("3 convocatorias")).toBeInTheDocument();
  });

  it("refleja el valor y notifica los cambios", async () => {
    const user = userEvent.setup();
    const onCambio = vi.fn();
    render(<BarraBusqueda valor="hola" onCambio={onCambio} conteo={0} />);

    const input = screen.getByRole("searchbox");
    expect(input).toHaveValue("hola");
    await user.type(input, "x");
    expect(onCambio).toHaveBeenCalled();
  });
});
