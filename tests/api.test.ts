import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock de axios: capturamos la instancia y los interceptores para poder
// invocarlos directamente y verificar las llamadas HTTP.
const mocks = vi.hoisted(() => {
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  const axiosDefault = {
    create: vi.fn(() => instance),
    post: vi.fn(),
    delete: vi.fn(),
  };
  return { instance, axiosDefault };
});

vi.mock("axios", () => ({ default: mocks.axiosDefault }));

import * as api from "../src/lib/api";

const reqInterceptor = mocks.instance.interceptors.request.use.mock.calls[0][0] as (
  c: { headers: Record<string, unknown> }
) => { headers: Record<string, unknown> };
const resCalls = mocks.instance.interceptors.response.use.mock.calls[0] as [
  (r: unknown) => unknown,
  (e: unknown) => Promise<never>
];
const onFulfilled = resCalls[0];
const onRejected = resCalls[1];

function clearCookie() {
  document.cookie = "hal_token=; path=/; max-age=0";
}
function setCookie(value: string) {
  document.cookie = `hal_token=${encodeURIComponent(value)}; path=/`;
}

beforeEach(() => {
  vi.clearAllMocks();
  clearCookie();
});

describe("token helpers (cookie SSO)", () => {
  it("getToken devuelve null sin cookie", () => {
    expect(api.getToken()).toBeNull();
  });

  it("getToken lee el valor de la cookie hal_token", () => {
    setCookie("my-jwt");
    expect(api.getToken()).toBe("my-jwt");
  });

  it("clearToken borra la cookie", () => {
    setCookie("my-jwt");
    api.clearToken();
    expect(api.getToken()).toBeNull();
  });

  it("getToken no falla en SSR (sin document)", () => {
    vi.stubGlobal("document", undefined);
    expect(api.getToken()).toBeNull();
    vi.unstubAllGlobals();
  });

  it("clearToken no falla en SSR (sin document)", () => {
    vi.stubGlobal("document", undefined);
    expect(() => api.clearToken()).not.toThrow();
    vi.unstubAllGlobals();
  });
});

describe("redirectToAuth", () => {
  it("asigna window.location.href a la URL de auth", () => {
    const hrefs: string[] = [];
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        set href(v: string) {
          hrefs.push(v);
        },
      },
    });
    api.redirectToAuth();
    expect(hrefs[0]).toMatch(/localhost|hospitalantoniolorena/);
    Object.defineProperty(window, "location", { configurable: true, value: original });
  });

  it("no falla en SSR (sin window)", () => {
    vi.stubGlobal("window", undefined);
    expect(() => api.redirectToAuth()).not.toThrow();
    vi.unstubAllGlobals();
  });
});

describe("interceptor de petición", () => {
  it("añade Authorization si hay cookie", () => {
    setCookie("tok");
    const cfg = reqInterceptor({ headers: {} });
    expect(cfg.headers.Authorization).toBe("Bearer tok");
  });

  it("no añade Authorization sin cookie", () => {
    const cfg = reqInterceptor({ headers: {} });
    expect(cfg.headers.Authorization).toBeUndefined();
  });
});

describe("interceptor de respuesta", () => {
  it("deja pasar las respuestas correctas", () => {
    expect(onFulfilled("ok")).toBe("ok");
  });

  it("401 dispara auth:logout y rechaza con sesión expirada", async () => {
    const eventSpy = vi.fn();
    window.addEventListener("auth:logout", eventSpy);

    await expect(
      onRejected({ response: { status: 401 }, config: { url: "/me" } })
    ).rejects.toThrow("Sesión expirada");

    expect(eventSpy).toHaveBeenCalled();
    window.removeEventListener("auth:logout", eventSpy);
  });

  it("usa el mensaje del servidor cuando existe", async () => {
    await expect(
      onRejected({ response: { status: 500, data: { error: "boom" } }, config: { url: "/x" } })
    ).rejects.toThrow("boom");
  });

  it("usa error.message si no hay respuesta", async () => {
    await expect(onRejected({ message: "network", config: {} })).rejects.toThrow("network");
  });

  it("mensaje por defecto cuando no hay nada", async () => {
    await expect(onRejected({ config: {} })).rejects.toThrow("Error en la solicitud");
  });
});

describe("perfil", () => {
  it("fetchPerfil", async () => {
    mocks.instance.get.mockResolvedValue({ data: { usuario: { usuario: "admin" } } });
    expect(await api.fetchPerfil()).toEqual({ usuario: "admin" });
    expect(mocks.instance.get).toHaveBeenCalledWith("/me");
  });
});

describe("convocatorias (admin)", () => {
  it("fetchConvocatorias", async () => {
    mocks.instance.get.mockResolvedValue({ data: { convocatorias: [{ slug: "c1" }] } });
    expect(await api.fetchConvocatorias()).toHaveLength(1);
    expect(mocks.instance.get).toHaveBeenCalledWith("/admin/convocatorias");
  });

  it("fetchConvocatoria codifica el slug", async () => {
    mocks.instance.get.mockResolvedValue({ data: { convocatoria: { slug: "a b" } } });
    expect(await api.fetchConvocatoria("a b")).toEqual({ slug: "a b" });
    expect(mocks.instance.get).toHaveBeenCalledWith("/admin/convocatorias/a%20b");
  });

  it("crearConvocatoria devuelve el slug", async () => {
    mocks.instance.post.mockResolvedValue({ data: { slug: "nueva" } });
    const slug = await api.crearConvocatoria({} as never);
    expect(slug).toBe("nueva");
    expect(mocks.instance.post).toHaveBeenCalledWith("/admin/convocatorias", expect.any(Object));
  });

  it("actualizarConvocatoria", async () => {
    mocks.instance.put.mockResolvedValue({ data: {} });
    await api.actualizarConvocatoria("a b", {} as never);
    expect(mocks.instance.put).toHaveBeenCalledWith(
      "/admin/convocatorias/a%20b",
      expect.any(Object)
    );
  });

  it("eliminarConvocatoria", async () => {
    mocks.instance.delete.mockResolvedValue({ data: {} });
    await api.eliminarConvocatoria("a b");
    expect(mocks.instance.delete).toHaveBeenCalledWith("/admin/convocatorias/a%20b");
  });
});

describe("archivos (registro en API)", () => {
  it("registrarArchivo devuelve el id", async () => {
    mocks.instance.post.mockResolvedValue({ data: { id: 42 } });
    const id = await api.registrarArchivo("a b", {
      etiqueta: "PDF",
      nombre: "doc.pdf",
      ext: "pdf",
      tamano: 100,
    });
    expect(id).toBe(42);
    expect(mocks.instance.post).toHaveBeenCalledWith(
      "/admin/convocatorias/a%20b/archivos",
      expect.any(Object)
    );
  });

  it("eliminarArchivo", async () => {
    mocks.instance.delete.mockResolvedValue({ data: {} });
    await api.eliminarArchivo("a b", 7);
    expect(mocks.instance.delete).toHaveBeenCalledWith(
      "/admin/convocatorias/a%20b/archivos/7"
    );
  });
});

describe("subida directa (multipart)", () => {
  it("subirArchivo envía FormData con token y reporta progreso", async () => {
    setCookie("tok");
    mocks.axiosDefault.post.mockResolvedValue({ data: { nombre: "doc.pdf" } });
    const archivo = { size: 200 } as File;
    const progreso: number[] = [];

    const r = await api.subirArchivo("slug-1", archivo, (p) => progreso.push(p));
    expect(r).toEqual({ nombre: "doc.pdf" });

    const [url, form, config] = mocks.axiosDefault.post.mock.calls[0];
    expect(url).toContain("/upload");
    expect(form).toBeInstanceOf(FormData);
    expect((config.headers as Record<string, string>).Authorization).toBe("Bearer tok");

    // Dispara el callback de progreso con total explícito.
    config.onUploadProgress({ loaded: 50, total: 200 });
    expect(progreso).toEqual([25]);
    // Si no hay total, usa el tamaño del archivo.
    config.onUploadProgress({ loaded: 100 });
    expect(progreso).toEqual([25, 50]);
  });

  it("subirArchivo sin token ni callback de progreso", async () => {
    mocks.axiosDefault.post.mockResolvedValue({ data: { nombre: "x" } });
    const archivo = { size: 0 } as File;
    await api.subirArchivo("slug-1", archivo);

    const [, , config] = mocks.axiosDefault.post.mock.calls[0];
    expect(config.headers).toBeUndefined();
    // Sin onProgress no lanza y con total 0 no llama.
    expect(() => config.onUploadProgress({ loaded: 10, total: 0 })).not.toThrow();
  });

  it("subirArchivo con progreso pero total 0 no reporta", async () => {
    mocks.axiosDefault.post.mockResolvedValue({ data: { nombre: "x" } });
    const archivo = { size: 0 } as File;
    const progreso: number[] = [];
    await api.subirArchivo("slug-1", archivo, (p) => progreso.push(p));

    const [, , config] = mocks.axiosDefault.post.mock.calls[0];
    config.onUploadProgress({ loaded: 10, total: 0 });
    expect(progreso).toEqual([]);
  });

  it("eliminarArchivoFisico con token", async () => {
    setCookie("tok");
    mocks.axiosDefault.delete.mockResolvedValue({ data: {} });
    await api.eliminarArchivoFisico("slug-1", "doc.pdf");

    const [url, config] = mocks.axiosDefault.delete.mock.calls[0];
    expect(url).toContain("/delete");
    expect((config.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(config.data).toEqual({ slug: "slug-1", nombre: "doc.pdf" });
  });

  it("eliminarArchivoFisico sin token", async () => {
    mocks.axiosDefault.delete.mockResolvedValue({ data: {} });
    await api.eliminarArchivoFisico("slug-1", "doc.pdf");

    const [, config] = mocks.axiosDefault.delete.mock.calls[0];
    expect(config.headers).toBeUndefined();
  });
});

describe("cliente REST genérico (api)", () => {
  it("api.get devuelve data", async () => {
    mocks.instance.get.mockResolvedValue({ data: { ok: 1 } });
    expect(await api.api.get("/x")).toEqual({ ok: 1 });
    expect(mocks.instance.get).toHaveBeenCalledWith("/x", undefined);
  });

  it("api.post devuelve data", async () => {
    mocks.instance.post.mockResolvedValue({ data: { ok: 2 } });
    expect(await api.api.post("/x", { a: 1 })).toEqual({ ok: 2 });
    expect(mocks.instance.post).toHaveBeenCalledWith("/x", { a: 1 }, undefined);
  });

  it("api.put devuelve data", async () => {
    mocks.instance.put.mockResolvedValue({ data: { ok: 3 } });
    expect(await api.api.put("/x", { a: 1 })).toEqual({ ok: 3 });
    expect(mocks.instance.put).toHaveBeenCalledWith("/x", { a: 1 }, undefined);
  });

  it("api.delete devuelve data", async () => {
    mocks.instance.delete.mockResolvedValue({ data: { ok: 4 } });
    expect(await api.api.delete("/x")).toEqual({ ok: 4 });
    expect(mocks.instance.delete).toHaveBeenCalledWith("/x", undefined);
  });
});
