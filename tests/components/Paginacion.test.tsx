// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Paginacion from "@/components/Paginacion";

describe("Paginacion", () => {
  it("no renderiza nada con una sola página", () => {
    const { container } = render(
      <Paginacion pagina={1} totalPaginas={1} onCambio={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza un botón por página y marca la activa", () => {
    render(<Paginacion pagina={2} totalPaginas={3} onCambio={() => {}} />);
    expect(screen.getByText("2")).toHaveClass("pag-btn--activo");
    expect(screen.getByText("1")).not.toHaveClass("pag-btn--activo");
  });

  it("deshabilita anterior en la primera y siguiente en la última", () => {
    const { rerender } = render(
      <Paginacion pagina={1} totalPaginas={3} onCambio={() => {}} />
    );
    expect(screen.getByRole("button", { name: "‹" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "›" })).not.toBeDisabled();

    rerender(<Paginacion pagina={3} totalPaginas={3} onCambio={() => {}} />);
    expect(screen.getByRole("button", { name: "›" })).toBeDisabled();
  });

  it("llama onCambio al pulsar una página o las flechas", async () => {
    const user = userEvent.setup();
    const onCambio = vi.fn();
    render(<Paginacion pagina={2} totalPaginas={3} onCambio={onCambio} />);

    await user.click(screen.getByText("3"));
    expect(onCambio).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole("button", { name: "‹" }));
    expect(onCambio).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole("button", { name: "›" }));
    expect(onCambio).toHaveBeenCalledWith(3);
  });
});
