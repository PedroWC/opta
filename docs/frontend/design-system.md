# Design system e tokens do front-end

> **Status:** tokens e base de estilo **implementados** na issue #17 (`web/src/styles`), com teste de contraste dos pares nos temas claro e escuro; os componentes de `web/src/ui` estão **implementados** na issue #18 (Button, TextField, MoneyField, PercentField, Select, CheckboxGroup, Callout, Disclosure, Tabs, Table, DefinitionList, Badge, Skeleton, VisuallyHidden, SkipLink), com vitrine em `#/ui` (somente em desenvolvimento) e teste do axe sobre ela; o `Combobox` (padrão APG, lista com preenchimento) foi implementado na #22 e o `RouteAnnouncer` na #19. Como não havia CSS existente, o design system **nasce** com o front (sem inventário a fazer). Tokens em três camadas (primitivo, semântico, componente); componentes só consomem o semântico. Contexto: [plano do front-end](plano-frontend.md).

## 1. Direção visual

Sóbria e legível: é uma ferramenta financeira usada para decidir, não um produto de marketing. Muito espaço em branco, números grandes e alinhados (`font-variant-numeric: tabular-nums`), cor reservada para **significado** (regime, estado, ação), nunca decorativa. Tom claro por padrão; o mapeamento semântico já prevê tema escuro.

## 2. Tokens

### 2.1 Cor (valores propostos; razões de contraste calculadas na mesma data do planejamento)

Primitivos e semânticos do tema claro:

| Token semântico | Valor | Sobre | Contraste | Uso |
|---|---|---|---|---|
| `--color-text` | `#14181F` | `#FFFFFF` | 17,8:1 | Texto principal |
| `--color-text-muted` | `#475467` | `#FFFFFF` (7,7) / `#F4F6F9` (7,1) | ≥ 7:1 | Dicas, legendas |
| `--color-bg` | `#FFFFFF` | — | — | Fundo da página |
| `--color-surface` | `#F4F6F9` | — | — | Cartões, tabelas zebradas |
| `--color-border-strong` | `#6B7686` | `#FFFFFF` | 4,6:1 | Borda de campo (componente de interface, ≥ 3:1) |
| `--color-border` | `#C9D0DA` | — | decorativa | Divisórias que não são o único indicador |
| `--color-action` | `#0B57D0` | texto branco: 6,4:1 | ≥ 4,5:1 | Botão primário, links |
| `--color-focus` | `#0B57D0` | `#FFFFFF` | 6,4:1 | Anel de foco (3 px + offset 2 px) |
| `--color-danger` | `#B42318` | `#FFFFFF` | 6,6:1 | Erro (sempre com ícone e texto) |
| `--color-success` | `#067647` | `#FFFFFF` | 5,7:1 | Confirmação |
| `--color-warning-bg` / `-text` | `#FFF4D6` / `#7A4A00` | — | 6,8:1 | Avisos da legislação |
| `--color-info-bg` / `-text` | `#E8F0FE` / `#0B3F99` | — | 8,4:1 | Faixa de premissas |
| `--color-regime-simples` | `#0B57D0` | `#FFFFFF` | 6,4:1 | Série "Simples Nacional" |
| `--color-regime-hibrido` | `#B4540A` | `#FFFFFF` | 5,0:1 | Série "Simples híbrido" |
| `--color-regime-presumido` | `#0F7B6C` | `#FFFFFF` | 5,2:1 | Série "Lucro Presumido" |

Tema escuro (implementado em `themes.css`, ativado por `data-theme="dark"`; fundo de cartão `#171C25`, aviso `#3A2A05`/`#FFD98A`, faixa de premissas `#0F2A55`/`#BBD3FF`, sucesso `#6FD3A0`; mapeamento verificado: todos ≥ 4,5:1 sobre `#0F131A`): texto `#EEF1F6`, muted `#A9B4C4`, ação e série Simples `#8AB4FF`, híbrido `#F0A35E`, presumido `#4FD1B8`, perigo `#FF8A80`, borda forte `#7C889A` (5,2:1).

Regras:

- Os três regimes sempre se distinguem por **cor + marcador + traço + rótulo**: Simples = quadrado, linha contínua; híbrido = losango, tracejada; presumido = círculo, pontilhada. Assim o gráfico funciona para daltonismo e em escala de cinza.
- O regime recomendado ganha selo de texto "Menor carga", não só cor.
- Contraste de todo par novo é conferido antes de entrar (script no CI do front, ver FE-02).

### 2.2 Tipografia

Pilha do sistema (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`) no MVP: zero custo de carga e legibilidade conhecida. Escala (rem, base 16 px, razão ≈ 1,2):

`--font-size-sm .875` · `base 1` · `lg 1.125` · `xl 1.375` · `2xl 1.75` · `3xl 2.25` (só o `h1` e o valor da economia). Altura de linha 1,5 em texto corrido e 1,25 em títulos; pesos 400, 600, 700. Números de tabela e gráfico com `tabular-nums`. Linha de leitura ≤ 70 caracteres.

### 2.3 Espaçamento, forma, elevação, movimento

- Espaçamento (base 4 px): `--space-1 .25rem`, `2 .5`, `3 .75`, `4 1`, `6 1.5`, `8 2`, `12 3`, `16 4`. Semânticos: `--space-stack-sm/md/lg`, `--space-inset-md`.
- Forma: `--radius-sm 4px`, `md 8px`, `lg 12px`; borda `1px` e `2px` (erro/foco).
- Elevação: `--shadow-sm` (cartão), `--shadow-md` (menu); `z-index` nomeados: `--z-header`, `--z-dialog`, `--z-toast`.
- Movimento: `--duration-fast 120ms`, `--duration-base 200ms`, `--ease-out`. Tudo sob `@media (prefers-reduced-motion: reduce)` zera durações e remove transições do gráfico.
- Alvo de toque: `--target-min: 2.75rem` (44 px) em controles; nunca abaixo de 24 px (WCAG 2.5.8).
- Breakpoints por conteúdo (documentados como tokens): `--bp-form-2col: 40em` (formulário em duas colunas), `--bp-result-wide: 64em` (resumo ao lado e tabela completa).

### 2.4 Organização dos arquivos

```
web/src/styles/
├─ tokens.primitives.css   # --blue-600, --gray-900, ...
├─ tokens.semantic.css     # --color-text, --color-action, ... (claro)
├─ themes.css              # mapeamento escuro e (futuro) alto contraste
├─ base.css                # reset mínimo, foco visível, tipografia, :root { color-scheme }
└─ print.css
```

Fonte única em JSON (formato do W3C Design Tokens) fica como **opcional** (Style Dictionary só se aparecer um segundo consumidor); no MVP, os CSS são a fonte e um teste de contraste lê os pares declarados.

## 3. Inventário de componentes

Critério de entrada na biblioteca: aparece em duas telas ou tem requisito de acessibilidade próprio. Cada componente documenta propósito, quando **não** usar, variantes, estados, teclado e ARIA.

| Componente | Base | Estados e variantes | Teclado / ARIA |
|---|---|---|---|
| `Button` | `<button>` | primário, secundário, texto; padrão, foco, desabilitado, carregando | Enter/Espaço; carregando usa `aria-disabled` + texto |
| `TextField` | `<input>` + `<label>` | padrão, erro, desabilitado; com dica; prefixo `R$`, sufixo `%` | `aria-describedby` (dica e erro), `aria-invalid`, `inputmode="decimal"` |
| `MoneyField` | `TextField` | máscara pt-BR; guarda texto decimal | Não bloqueia colar; lê valor completo |
| `PercentField` / `Slider` | `<input type="number">` e `<input type="range">` | B2B com complemento B2C | Setas; valor sincronizado com campo numérico |
| `Select` | `<select>` nativo | UF | Nativo |
| `CheckboxGroup` | `fieldset` + `legend` | regimes | Espaço |
| `Combobox` | Radix ou implementação do APG (lista) | buscando, vazio, erro | Setas, Enter, Esc, `aria-activedescendant`; anúncio de contagem de resultados |
| `Callout` | `div` com `role="status"` ou `alert` | info, aviso, erro, sucesso | Ícone + texto (nunca só cor) |
| `Disclosure` | `<details>` | fechado/aberto | Nativo |
| `Tabs` | padrão APG | por regime | Setas, Home/End |
| `Table` | `<table>` com `caption`, `th scope` | zebra, linha de destaque, linha de total | Cabeçalhos associados; rolagem contida focável |
| `DefinitionList` | `<dl>` | forma mobile da tabela e da memória | Semântica de lista |
| `Badge` | `span` | "Menor carga", versão das premissas | Texto sempre presente |
| `Skeleton` / `Spinner` | — | `aria-busy` na região | Sem animação sob reduced motion |
| `VisuallyHidden`, `SkipLink`, `RouteAnnouncer` | — | utilitários | Região `status` única para anúncios |

Componentes de domínio (no feature, não em `ui/`): `RegimeBadge` (regime → cor, marcador, rótulo, **único** lugar que conhece o mapeamento), `MoneyCell`, `EffectiveRate`.

## 4. Documentação viva

Storybook (ou rota `/_prototipos` em desenvolvimento, decisão em FE-03) com uma história por estado, `axe` por história e captura visual opcional. SemVer interno só se a biblioteca for extraída; renomear token é mudança incompatível dentro do repositório e exige busca global no mesmo PR.

## 5. Checklist

- [ ] Nenhum valor literal de cor, espaço, raio ou sombra em componente.
- [ ] Componentes usam só tokens semânticos ou de componente.
- [ ] Todos os pares de cor passam no contraste AA (script no CI).
- [ ] Série de gráfico e estado nunca só por cor.
- [ ] Tema escuro verificado, não apenas invertido (pós-MVP, mas tokens prontos).
