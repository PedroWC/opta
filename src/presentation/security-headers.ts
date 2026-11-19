import type { Context, Next } from "hono";

/**
 * Cabeçalhos de segurança em toda resposta (RNF-06, RNF-12). A CSP é restritiva: só recursos da própria origem,
 * sem scripts inline; `style-src-attr` permite apenas atributos `style` (usados pelo React e pelo gráfico).
 */
export class SecurityHeaders {
  private static readonly CONTENT_SECURITY_POLICY = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  private static readonly HEADERS: Readonly<Record<string, string>> = {
    "Content-Security-Policy": SecurityHeaders.CONTENT_SECURITY_POLICY,
    "X-Content-Type-Options": "nosniff",
    // O endereço pode carregar a simulação no fragmento; mesmo assim, nada de referência para outros sites.
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  };

  middleware = async (c: Context, next: Next): Promise<void> => {
    await next();
    for (const [name, value] of Object.entries(SecurityHeaders.HEADERS)) c.res.headers.set(name, value);
  };
}
