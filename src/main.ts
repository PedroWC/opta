// Único arquivo procedural permitido (RNF-01): apenas compõe as classes e sobe o servidor.
import { serve } from "@hono/node-server";
import { CompositionRoot } from "./composition-root.ts";

const root = await CompositionRoot.fromEnvironment(process.env);
const port = Number(process.env["PORT"] ?? 3000);

serve({ fetch: root.httpServer.fetchHandler(), port });
console.log(`Opta ouvindo em http://localhost:${port}/v1/health`);
