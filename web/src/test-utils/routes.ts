import type { SimulationRequest } from "../api/types.ts";
import { encodeRequest } from "../features/share/inputUrlCodec.ts";
import { requestFixture } from "./fixtures.ts";

/** Endereço do resultado com a simulação no fragmento, como o app gera ao enviar o formulário. */
export function resultLocation(request: SimulationRequest = requestFixture): { pathname: string; hash: string } {
  return { pathname: "/resultado", hash: `#${encodeRequest(request)}` };
}
