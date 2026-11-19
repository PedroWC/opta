import { describe, expect, test } from "vitest";
import { CompositionRoot } from "../src/composition-root.ts";

describe("RF-07: saúde do serviço", () => {
  test("RF-07: GET /v1/health responde ok", async () => {
    const handler = new CompositionRoot().httpServer.fetchHandler();
    const response = await handler(new Request("http://localhost/v1/health"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", service: "opta" });
  });
});
