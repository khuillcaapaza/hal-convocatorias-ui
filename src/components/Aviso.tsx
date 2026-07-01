import type { Mensaje } from "./adminHelpers";

/**
 * Banner de aviso reutilizable. No renderiza nada si `mensaje` es null.
 */
export default function Aviso({ mensaje }: { mensaje: Mensaje }) {
  if (!mensaje) return null;
  return (
    <p className={"aviso" + (mensaje.tipo === "error" ? " aviso--error" : "")}>
      {mensaje.texto}
    </p>
  );
}
