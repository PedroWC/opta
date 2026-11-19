import type { Context } from "hono";

export class HealthController {
  handle = (c: Context): Response => c.json({ status: "ok", service: "opta" });
}
