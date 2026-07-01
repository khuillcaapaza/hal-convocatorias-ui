// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { IconoConvocatorias, IconoBuscar } from "@/components/icons";

describe("icons", () => {
  it("IconoConvocatorias renderiza un <svg>", () => {
    const { container } = render(<IconoConvocatorias />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("IconoBuscar renderiza un <svg> con un círculo", () => {
    const { container } = render(<IconoBuscar />);
    expect(container.querySelector("svg circle")).toBeInTheDocument();
  });
});
