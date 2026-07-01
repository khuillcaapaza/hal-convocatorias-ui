import { describe, it, expect } from "vitest";
import { formatearBytes, formInicial, AREAS, POR_PAGINA } from "@/components/adminHelpers";

describe("adminHelpers.formatearBytes", () => {
  it("devuelve '0 B' para 0 o falsy", () => {
    expect(formatearBytes(0)).toBe("0 B");
  });

  it("formatea bytes, KB, MB y GB", () => {
    expect(formatearBytes(512)).toBe("512 B");
    expect(formatearBytes(1024)).toBe("1.0 KB");
    expect(formatearBytes(1536)).toBe("1.5 KB");
    expect(formatearBytes(1048576)).toBe("1.0 MB");
    expect(formatearBytes(1073741824)).toBe("1.0 GB");
  });
});

describe("adminHelpers.formInicial", () => {
  it("devuelve los valores por defecto de una convocatoria nueva", () => {
    expect(formInicial()).toEqual({
      titulo: "",
      area: "CAS",
      fecha_publicacion: "",
      estado: "Abierta",
      descripcion: "",
      cuerpo: "",
      publicado: true,
    });
  });
});

describe("adminHelpers constantes", () => {
  it("expone AREAS y POR_PAGINA", () => {
    expect(AREAS).toContain("CAS");
    expect(POR_PAGINA).toBe(9);
  });
});
