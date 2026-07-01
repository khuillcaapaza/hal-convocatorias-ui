// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Aviso from "@/components/Aviso";

describe("Aviso", () => {
  it("no renderiza nada cuando el mensaje es null", () => {
    const { container } = render(<Aviso mensaje={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra un mensaje de éxito sin la clase de error", () => {
    render(<Aviso mensaje={{ texto: "Guardado", tipo: "ok" }} />);
    const p = screen.getByText("Guardado");
    expect(p).toHaveClass("aviso");
    expect(p).not.toHaveClass("aviso--error");
  });

  it("añade la clase de error para mensajes de error", () => {
    render(<Aviso mensaje={{ texto: "Ups", tipo: "error" }} />);
    expect(screen.getByText("Ups")).toHaveClass("aviso--error");
  });
});
