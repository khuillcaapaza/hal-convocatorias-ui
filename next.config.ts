import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exportación estática: el hosting es SFTP-only (Apache/nginx) sin Node.
  output: "export",
  // Sin optimizador de imágenes (no hay servidor Node en producción).
  images: { unoptimized: true },
  // Genera carpetas con index.html para servirse como estáticos.
  trailingSlash: true,
  // Se publica bajo /admin en el subdominio (vacío en local). Lo fija el build.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

export default nextConfig;
