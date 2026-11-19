# ADR-0002 — Stack: TypeScript, Node, Hono e Vitest

- **Status:** Aceito
- **Requisitos:** RNF-03, RNF-04

## Decisão
TypeScript estrito em Node 22 com npm; Hono como servidor HTTP (adaptador fino, chamado por controllers); Vitest para testes e cobertura; ESLint e dependency-cruiser para as regras de arquitetura; tsx para execução em desenvolvimento. Front-end futuro: React com Vite.

## Consequências
A aplicação roda em Node ou Bun sem mudar o domínio, pois ele não depende do servidor. O servidor pode ser trocado sem afetar as regras fiscais.
