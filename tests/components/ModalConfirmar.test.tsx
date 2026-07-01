// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ModalConfirmar, {
  type ConfirmacionState,
} from "@/components/ModalConfirmar";

const estadoBase = (over: Partial<ConfirmacionState> = {}): ConfirmacionState => ({
  titulo: "Eliminar algo",
  mensaje: "¿Seguro?",
  onConfirmar: vi.fn(),
  ...over,
});

describe("ModalConfirmar", () => {
  it("no renderiza nada cuando el estado es null", () => {
    const { container } = render(
      <ModalConfirmar estado={null} onCerrar={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra el título y el mensaje", () => {
    render(<ModalConfirmar estado={estadoBase()} onCerrar={() => {}} />);
    expect(screen.getByText("Eliminar algo")).toBeInTheDocument();
    expect(screen.getByText("¿Seguro?")).toBeInTheDocument();
  });

  it("cancela cerrando el modal", async () => {
    const user = userEvent.setup();
    const onCerrar = vi.fn();
    render(<ModalConfirmar estado={estadoBase()} onCerrar={onCerrar} />);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCerrar).toHaveBeenCalled();
  });

  it("confirma ejecutando onConfirmar y luego cierra", async () => {
    const user = userEvent.setup();
    const onConfirmar = vi.fn().mockResolvedValue(undefined);
    const onCerrar = vi.fn();
    render(
      <ModalConfirmar
        estado={estadoBase({ onConfirmar, etiquetaConfirmar: "Borrar" })}
        onCerrar={onCerrar}
      />
    );
    await user.click(screen.getByRole("button", { name: "Borrar" }));
    expect(onConfirmar).toHaveBeenCalled();
    await waitFor(() => expect(onCerrar).toHaveBeenCalled());
  });

  it("cierra al pulsar Escape", () => {
    const onCerrar = vi.fn();
    render(<ModalConfirmar estado={estadoBase()} onCerrar={onCerrar} />);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onCerrar).toHaveBeenCalled();
  });
});
