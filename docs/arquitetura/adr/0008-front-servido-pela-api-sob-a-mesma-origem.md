# ADR-0008 — Front-end servido pela API sob a mesma origem, com CSP restritiva

- **Status:** Aceito
- **Requisitos:** RNF-06, RNF-11, RNF-12, RF-08
- **Issue:** #31 (resolve o ponto em aberto do ADR-0006 e da DEC-15)

## Contexto
O ADR-0006 deixou para a entrega decidir como servir o front-end: mesma origem ou CORS. A simulação do usuário vive no fragmento da URL (RNF-12) e a API não exige autenticação, então a superfície de ataque deve ser mínima.

## Decisão
1. **Mesma origem:** a API (Hono) serve o build estático do front (`web/dist`, definido por `OPTA_WEB_DIR`) e as rotas `/v1/*`. Não há CORS. Em desenvolvimento, o proxy `/v1` do Vite cumpre o mesmo papel.
2. **Servidor de arquivos em classe** (`StaticSiteController`): rotas da SPA sem extensão caem no `index.html`; arquivo inexistente, rota `/v1/*` desconhecida e método diferente de GET respondem 404 em Problem Details (a API nunca devolve HTML); caminhos que saem da pasta, com `\0` ou codificação inválida são recusados. Arquivos em `/assets/` (com hash) são `immutable` por um ano; o resto é `no-cache`.
3. **Cabeçalhos de segurança em toda resposta** (`SecurityHeaders`): CSP com `default-src 'self'`, `script-src 'self'` (sem inline nem `eval`), `style-src 'self'` com `style-src-attr 'unsafe-inline'` apenas para atributos `style`, `connect-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`; mais `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` sem sensores e `Cross-Origin-Opener/Resource-Policy: same-origin`.
4. **Compressão** gzip (middleware do Hono) em HTML, JS e JSON.
5. **Verificação:** testes de unidade (caminhos, tipos, cache, cabeçalhos) e **E2E em modo produção** (`E2E_PROD=1`): build estático servido pela API, sem violação de CSP nem erro de console em todo o fluxo, todas as chamadas na mesma origem, orçamento de JS inicial de 200 KB gzip, LCP abaixo de 2,5 s e CLS abaixo de 0,1.

## Consequências
- Um único processo e uma única origem para a demonstração (#14); sem configuração de CORS.
- A CSP sem `unsafe-eval` obrigou a desligar a compilação JIT do Zod 4 (`z.config({ jitless: true })`), que sondava `new Function`; o comportamento é o mesmo.
- O HSTS não é enviado pela aplicação: depende de HTTPS, que é responsabilidade da hospedagem (#14).
- O Lighthouse não roda no CI; os orçamentos de Core Web Vitals e de tamanho são medidos no E2E de produção. Auditoria manual: `npx lighthouse http://localhost:3000` com o build servido.
