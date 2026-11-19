# Acessibilidade e responsividade do front-end

> **Status:** proposta. Meta: **WCAG 2.2 nível AA** (RNF-09, proposto) e uso confortável de 320 px a 1440 px (RNF-10, proposto). Base normativa: WCAG 2.2 e ARIA Authoring Practices (APG). Contexto: [plano](plano-frontend.md), [design system](design-system.md).

## 1. Acessibilidade

### 1.1 Estrutura e navegação

- `<html lang="pt-BR">`; um `<main>` por página; marcos `header`, `nav` (com `aria-label`), `main`, `footer`; títulos `h1` a `h3` sem pular nível; um `h1` por rota.
- **Troca de rota em SPA:** `document.title` único por rota ("Resultado da simulação — Opta"); ao concluir a navegação ou o cálculo, o foco vai ao `h1` (`tabindex="-1"`) e um `RouteAnnouncer` (`role="status"`) anuncia a nova página. A região de anúncio existe no DOM desde o primeiro render.
- Primeiro elemento focável: "Pular para o conteúdo". `scroll-padding-top` evita que cabeçalho fixo cubra o foco (2.4.11).
- Ordem de foco = ordem visual; nada de `tabindex` positivo.

### 1.2 Formulário (critérios 1.3.1, 3.3.1 a 3.3.4, 3.3.7, 4.1.2)

- `label` visível para cada campo; placeholder nunca substitui rótulo; obrigatoriedade com texto "(obrigatório)", não só asterisco.
- Dicas e erros ligados por `aria-describedby`; `aria-invalid="true"` só após validação.
- **Resumo de erros** no topo ao enviar: `role="alert"` no contêiner, foco nele, links para cada campo. Mensagens dizem o que fazer ("Informe um percentual entre 0 e 100"), não só o que está errado (3.3.3).
- Validação ao sair do campo (blur) e ao enviar; nunca enquanto a pessoa ainda digita.
- Não digitar de novo o que já informou: "Ajustar dados" preserva a entrada (3.3.7); o exemplo e o link compartilhável usam o mesmo codec.
- Máscara de moeda permite colar e não impede digitar vírgula ou ponto; o valor lido pelo leitor de tela é o número completo.
- Grupos (regimes) em `fieldset` + `legend`.
- **CNAE (combobox):** seguir o padrão *combobox com lista* do APG (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, Esc fecha, Setas navegam, Enter seleciona). Anunciar "5 resultados disponíveis" em `status`. Ter caminho sem lista: aceitar digitar o código completo e validar.

### 1.3 Resultado, gráfico e tabelas

- **Gráfico:** é um complemento. Os mesmos dados estão na tabela "Comparativo ano a ano", sempre no DOM e a um Tab de distância; o gráfico tem `role="img"` com `aria-label` resumindo a conclusão ("Carga por ano de 2026 a 2033; o Simples híbrido tem a menor carga a partir de 2028") e `aria-describedby` apontando para a tabela. Se a camada de acessibilidade do Recharts permitir navegar por teclado, usar; senão, a tabela é o caminho oficial. [A CONFIRMAR na implementação]
- Séries distinguidas por cor, marcador e traço; rótulo direto na última ponta; legenda em texto. Contraste de elementos gráficos ≥ 3:1 (1.4.11).
- Dicas (tooltip) do gráfico também aparecem ao receber foco/toque e não dependem de hover (1.4.13); o conteúdo do tooltip está na tabela.
- **Tabela de dados:** `<table>` com `<caption>`, `th scope="col|row"`, linha de total com `th scope="row"`. Em telas estreitas, usar lista de definição com os mesmos rótulos (não `display: block` sobre `<table>` que quebra a semântica sem aviso).
- **Memória de cálculo:** `<details>/<summary>` por ano; abas (APG) por regime, ou, no mobile, subseções com títulos. Cabeçalhos: Tributo, Base, Alíquota, Valor, Fonte legal.
- Melhor regime: texto "Menor carga" + ícone com `aria-hidden` e texto equivalente; nunca só cor ou negrito.
- Valores: `R$ 214.800,00` lido por extenso; abreviações compactas ("R$ 214,8 mil") só em visão resumida, com `aria-label` do valor completo.
- Siglas (CBS, IBS, DAS, RBT12, CNAE) com `<abbr title>` na primeira ocorrência de cada tela e glossário em `/sobre`.

### 1.4 Estados dinâmicos

| Evento | Mecanismo |
|---|---|
| Carregando resultado | `aria-busy="true"` na região + texto visível "Calculando…" |
| Resultado pronto | `status`: "Resultado pronto. Melhor regime: …" + foco no `h1` |
| Erro de rede | `alert` só para erro que impede a tarefa; demais como `status` |
| Link copiado | `status` |
| Exemplo preenchido | `status` |

### 1.5 Visual e movimento

- Contraste: texto ≥ 4,5:1; componentes e foco ≥ 3:1; pares validados em [design-system.md](design-system.md).
- Foco visível: anel de 3 px + offset de 2 px, nunca `outline: none` sem substituto.
- Zoom: sem `user-scalable=no`; reflow sem rolagem horizontal em 320 px e com zoom de 400% (1.4.10); espaçamento de texto ajustável (1.4.12) sem perda de conteúdo.
- Movimento: sem animação essencial; `prefers-reduced-motion` desativa transição do gráfico e do esqueleto.
- Alvos: ≥ 44 px (mínimo AA 24 px); espaço entre alvos adjacentes no mobile.
- Informação nunca só por cor (1.4.1): erro tem ícone e texto; série tem marcador.

### 1.6 Verificação

| Camada | Como | Quando |
|---|---|---|
| Lint | `eslint-plugin-jsx-a11y` | Todo commit (CI) |
| Componente | `jest-axe` em cada `ui/` e página, todos os estados | Todo PR |
| E2E | `@axe-core/playwright` com tags `wcag2a`, `wcag2aa`, `wcag22aa` nas 3 telas e no resultado | CI |
| Teclado | Roteiro: percorrer o fluxo US-01 só com Tab, Shift+Tab, Enter, Espaço, Esc e setas | Manual, por fatia |
| Leitor de tela | NVDA + Firefox (Windows), VoiceOver + Safari (macOS/iOS), TalkBack (Android): rotas, formulário, resultado, tabela | Manual, antes do #14 |
| Zoom/contraste | 200% e 400%, modo de alto contraste do sistema | Manual |
| Lighthouse | Acessibilidade ≥ 95 como alerta no CI | CI |
| Auditoria | Revisão de acessibilidade (WCAG 2.2 AA) e heurística de usabilidade sobre a interface implementada | FE-15 |

Automático pega só parte dos problemas; a auditoria manual com leitor de tela é critério de pronto do FE-15.

## 2. Responsividade

### 2.1 Abordagem

Mobile-first, sem biblioteca de grade: CSS Grid e Flexbox com tokens; `min()`, `clamp()` e container queries onde o componente muda por largura do contêiner (a tabela, o resumo ao vivo). Breakpoints por conteúdo (não por dispositivo): o formulário passa para duas colunas quando duas seções cabem lado a lado (~40 em); o resultado ganha o resumo da entrada ao lado e a tabela completa em ~64 em.

| Largura | Layout | Observações |
|---|---|---|
| 320–599 px | Coluna única; navegação em painel (`<dialog>`); tabelas viram cartões; gráfico de linhas de 280 px | Botão principal com largura total; teclado numérico (`inputmode="decimal"`) |
| 600–1023 px | Formulário em 2 colunas nas seções curtas; gráfico 360 px; tabela completa com rolagem contida só se necessário | — |
| ≥ 1024 px | Contêiner de até 72 em; resumo ao vivo/entrada ao lado; gráfico 420 px; memória com cabeçalhos fixos | Evitar linhas de texto > 70 caracteres |

### 2.2 Regras

- `<meta name="viewport" content="width=device-width, initial-scale=1">`, sem bloquear zoom.
- Tabela de 8 linhas x 3 regimes: no mobile vira cartões por ano (`DefinitionList`); a memória de cálculo nunca usa rolagem horizontal.
- Gráfico: SVG responsivo (largura 100%, altura proporcional); no mobile mostrar rótulos de eixo a cada 2 anos e valores em painel ao tocar; legenda abaixo do gráfico, não sobre ele.
- Zona do polegar: ação principal ("Simular regimes") no fim do formulário, largura total; "Ajustar dados" visível no topo do resultado.
- Teclado virtual: campos com `inputmode`/`autocomplete="off"` apropriados; o botão não fica escondido atrás do teclado (rolar o campo ativo para a vista).
- Impressão: `print.css` (sem navegação, memória aberta, aviso legal no rodapé).
- Testes: Playwright com viewports 320x640, 390x844, 768x1024 e 1440x900; captura de tela das 3 telas em cada um (comparação visual opcional).

### 2.3 Desempenho percebido (relacionado)

Esqueleto na carga do resultado; gráfico carregado sob demanda; fonte do sistema; nenhuma imagem raster no MVP (logotipo em SVG). Metas em [plano](plano-frontend.md), seção 9.

## 3. Critérios de aceite transversais (valem para todo item de front)

1. Concluir US-01 só com teclado, sem armadilha de foco.
2. Zero violações `axe` (AA) nas telas e estados cobertos.
3. Nenhuma rolagem horizontal da página em 320 px.
4. Todo texto e componente cumpre os contrastes do design system.
5. `prefers-reduced-motion` respeitado.
