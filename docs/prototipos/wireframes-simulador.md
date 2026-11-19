# Wireframes e microtextos do simulador

> **Status:** proposta de baixa/média fidelidade (tons de cinza, conteúdo realista). Serve para alinhar estrutura e hierarquia antes de qualquer código. Plano geral: [plano do front-end](../frontend/plano-frontend.md). Números do exemplo seguem a US-01 (receita R$ 1,8 mi, folha R$ 540 mil, 70% B2B); **os valores calculados abaixo são fictícios**, só para dar realismo ao desenho.

Legenda: `[ ]` campo · `( )` opção · `[Botão]` ação · `▾` lista · `(1)` anotação · `░` carregando.

## 1. Decisões de estrutura

- **Uma pergunta por seção**, em ordem de esforço: quem é a empresa → quanto fatura → para quem vende → o que comparar.
- **Resultado em página própria**, com o formulário a um clique de distância ("Ajustar dados"); em desktop, o resumo da entrada fica visível ao lado (colapsável).
- **Leitura em camadas:** primeiro a recomendação (1 frase + economia), depois o gráfico, depois a tabela, por fim a memória de cálculo (detalhe sob demanda).
- Navegação global com 3 itens: **Simulador · Premissas · Metodologia**.

## 2. Tela 1 — Simulador (`/`)

### Desktop (≥ 64 em)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ▸ Pular para o conteúdo                                                  │
├──────────────────────────────────────────────────────────────────────────┤
│ Opta        Simulador   Premissas   Metodologia                          │
├──────────────────────────────────────────────────────────────────────────┤
│ ⓘ Simulador educacional, não substitui contador. Premissas v2026.1 (1)   │
├──────────────────────────────────────────────────────────────────────────┤
│ h1  Qual regime compensa na Reforma Tributária?                          │
│ Compare Simples Nacional, Simples híbrido e Lucro Presumido, de 2026 a   │
│ 2033.                          [Preencher com um exemplo] (2)            │
│                                                                          │
│ ┌─ 1. Sua empresa ───────────────────────┐ ┌─ Resumo ao vivo (3) ──────┐ │
│ │ Atividade (CNAE) *                     │ │ Fator R aproximado: 30%   │ │
│ │ [ 6201-5/01 ▾ ] Desenv. de programas…  │ │ (folha ÷ receita anual)   │ │
│ │ UF *            Alíquota de ISS *      │ │ Atividade: Serviços       │ │
│ │ [ SP ▾ ]        [ 5,00 ] %             │ │ Anexo provável: V ou III  │ │
│ └────────────────────────────────────────┘ └───────────────────────────┘ │
│ ┌─ 2. Seus números (últimos 12 meses ou estimativa do ano) ───────────┐  │
│ │ Receita bruta anual *          Folha de pagamento anual *            │  │
│ │ R$ [ 1.800.000,00 ]            R$ [ 540.000,00 ]                     │  │
│ │ Inclui salários, pró-labore e encargos.  (4)                         │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│ ┌─ 3. Para quem você vende ───────────────────────────────────────────┐  │
│ │ Clientes empresas (B2B)  ──●──────────  70 %    Pessoas físicas 30 %│  │
│ │ Compras que geram crédito (% da receita)  [ 25 ] %   (5)            │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│ ┌─ 4. O que comparar ─────────────────────────────────────────────────┐  │
│ │ [x] Simples Nacional  [x] Simples híbrido  [x] Lucro Presumido  (6)  │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                           [ Simular regimes ]  (7)        │
├──────────────────────────────────────────────────────────────────────────┤
│ Rodapé: Metodologia · Fontes legais · Código no GitHub · v0.x (API v1)   │
└──────────────────────────────────────────────────────────────────────────┘
```

Anotações:

1. **Faixa de aviso e versão das premissas**: sempre visível; o texto da versão vem da API; o "ⓘ" abre explicação curta. Mitiga o risco "responsabilidade" da spec (seção 10).
2. **Exemplo preenchido** (US-05): preenche tudo com a US-01 e mantém o foco no primeiro campo; anuncia "Exemplo preenchido" em região `status`.
3. **Resumo ao vivo**: só leitura, `aria-live="polite"` com atraso para não tagarelar no leitor de tela. Mostra o que a API já sabe sobre o CNAE (`GET /v1/atividades`) e o Fator R aproximado (decisão D-4). Em mobile vira um bloco recolhível abaixo da seção 2.
4. **Dica sob o campo** em linguagem simples; define o termo ("folha"). Glossário em tooltip acionável por teclado, nunca só hover.
5. **Compras com crédito**: ajuda "Insumos e serviços que você compra de empresas e que geram crédito de CBS/IBS, em % da receita." Valor típico sugerido como texto de apoio, não como valor padrão.
6. **Regimes**: os três marcados por padrão; exige pelo menos um (erro se vazio). O Simples híbrido traz uma dica "recolhe CBS/IBS fora do DAS".
7. **Botão principal único**; ao enviar, vira "Simulando…" (desabilitado, mas com `aria-disabled` e texto, não só spinner).

Campos e validação (RN-09, mensagens em PT-BR, ligadas ao campo por `aria-describedby`):

| Campo | Tipo/máscara | Regra | Mensagem de erro |
|---|---|---|---|
| CNAE | combobox; formato `0000-0/00` | obrigatório; precisa existir | "Informe um CNAE válido, por exemplo 6201-5/01. Digite o código ou parte da descrição." |
| UF | select de 27 UFs | obrigatório | "Escolha o estado." |
| Alíquota de ISS | percentual, 2 casas | 0 a 100; rótulo muda para "Alíquota de ICMS" quando a atividade for comércio | "Informe um percentual entre 0 e 100." |
| Receita bruta anual | moeda BRL | ≥ 0; obrigatória | "Informe a receita bruta anual (use 0 se não houver)." |
| Folha anual | moeda BRL | ≥ 0 | "Informe a folha anual (use 0 se não houver)." |
| % B2B | controle deslizante + campo numérico | inteiro 0 a 100; B2C = 100 − B2B | "Use um número inteiro de 0 a 100." |
| Compras creditáveis | percentual | inteiro 0 a 100 | idem |
| Regimes | grupo de caixas | ao menos 1 | "Escolha ao menos um regime para comparar." |

### Mobile (320–400 px), coluna única

```
┌────────────────────────┐
│ Opta               ☰   │
├────────────────────────┤
│ ⓘ Simulador educacional│
│   Premissas v2026.1 ▾  │
│ h1 Qual regime         │
│    compensa?           │
│ [Preencher exemplo]    │
│                        │
│ 1. Sua empresa         │
│ CNAE * [6201-5/01 ▾  ] │
│ UF *   [SP ▾         ] │
│ ISS *  [5,00      ] %  │
│                        │
│ 2. Seus números        │
│ Receita anual *        │
│ R$ [1.800.000,00    ]  │
│ Folha anual *          │
│ R$ [540.000,00      ]  │
│ ▸ Fator R aprox.: 30%  │
│                        │
│ 3. Para quem vende     │
│ B2B   70% ───●───      │
│ Compras creditáveis    │
│ [25] %                 │
│                        │
│ 4. Comparar            │
│ [x] Simples Nacional   │
│ [x] Simples híbrido    │
│ [x] Lucro Presumido    │
│                        │
│ [   Simular regimes  ] │  ← largura total, alvo ≥ 48 px
└────────────────────────┘
```

Menu ☰ abre um `<dialog>`/painel com 3 links; no desktop os links ficam à vista.

### Estados da tela 1

| Estado | Comportamento |
|---|---|
| Padrão | Campos vazios, exemplo disponível. Sem valores pré-selecionados enganosos. |
| Erro de validação | Resumo no topo ("3 campos precisam de ajuste") com links para cada campo; foco no resumo; campos com borda e ícone (não só cor). |
| Carregando atividade | Mini spinner no combobox com texto "Buscando atividades…" (`status`). |
| CNAE sem resultado | "Nenhuma atividade encontrada para 'xyz'. Tente o código com 7 dígitos." |
| Enviando | Botão "Simulando…"; formulário continua visível. |
| Erro do servidor / sem rede | Callout de erro acima do botão, com "Tentar de novo"; dados preservados. |
| Link com dados inválidos | Aviso "Alguns dados do link não puderam ser usados" e campos válidos preenchidos. |

## 3. Tela 2 — Resultado (`/resultado#...`)

### Desktop

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Opta        Simulador   Premissas   Metodologia                          │
│ ⓘ Simulador educacional · Premissas v2026.1                              │
├──────────────────────────────────────────────────────────────────────────┤
│ h1 Resultado da simulação                                                │
│ Serviços de TI · SP · Receita R$ 1,8 mi · 70% B2B     [Ajustar dados] (1) │
│                                                       [Copiar link] (2)  │
│ ┌─ Recomendação ────────────────────────────────────────────────────────┐│
│ │ h2 Fique no Simples híbrido                    (selo: menor carga)    ││
│ │ Economia acumulada 2026–2033: R$ 214.300 vs. o Simples Nacional       ││
│ │ Por quê: 70% das suas vendas são B2B; seus clientes aproveitam crédito││
│ │ cheio de CBS/IBS, e você também credita 25% de compras.  (3)          ││
│ │ [Ver como calculamos ↓]                                               ││
│ └───────────────────────────────────────────────────────────────────────┘│
│ h2 Carga tributária por ano            (•) Gráfico  ( ) Tabela  (4)       │
│ ┌───────────────────────────────────────────────────────────────────────┐│
│ │ R$ mil                                                                ││
│ │ 400 ┤            ◆─────◆                    ■ Simples Nacional ──     ││
│ │ 300 ┤      ■──■─────■                       ◆ Simples híbrido  ─ ─    ││
│ │ 200 ┤  ●──●─────●                           ● Lucro Presumido  ···    ││
│ │     └──2026──2027──2028──2029──2030──2031──2032──2033                 ││
│ └───────────────────────────────────────────────────────────────────────┘│
│ h2 Comparativo ano a ano                                                 │
│ ┌──────┬───────────────┬────────────────┬──────────────────┬───────────┐ │
│ │ Ano  │ Simples Nac.  │ Simples híbrido│ Lucro Presumido  │ Menor     │ │
│ ├──────┼───────────────┼────────────────┼──────────────────┼───────────┤ │
│ │ 2026 │ R$ 130.200    │ R$ 130.200     │ R$ 168.900       │ Simples*  │ │
│ │ …    │ …             │ …              │ …                │ …         │ │
│ │ 2033 │ R$ 214.800    │ R$ 181.500     │ R$ 233.000       │ Híbrido ✓ │ │
│ ├──────┼───────────────┼────────────────┼──────────────────┼───────────┤ │
│ │ Total│ R$ 1.402.000  │ R$ 1.187.700   │ R$ 1.612.400     │ Híbrido ✓ │ │
│ └──────┴───────────────┴────────────────┴──────────────────┴───────────┘ │
│ Alíquota efetiva em cada célula, em texto menor sob o valor. (5)          │
│ h2 Memória de cálculo  (6)                                               │
│ ▸ 2026   ▸ 2027   ▸ 2028 ... ▾ 2033                                      │
│   [Simples Nac.] [Simples híbrido] [Lucro Presumido]    (abas)           │
│   Tributo   Base           Alíquota   Valor       Fonte legal            │
│   DAS       R$ 1.800.000   11,94%     R$ 214.800  LC 123/2006, Anexo III │
│   …                                                                       │
│ ⚠ Avisos da legislação (⚠ da spec): lista de `avisos[]` da API  (7)      │
└──────────────────────────────────────────────────────────────────────────┘
```

Anotações:

1. **Ajustar dados** volta a `/` com tudo preenchido (reuso do fragmento; evita redigitar, critério 3.3.7 da WCAG).
2. **Copiar link** (US-07): copia a URL com fragmento; confirma em `status` ("Link copiado"). Texto avisa: "O link contém os números que você digitou; compartilhe com cuidado."
3. **Motivo** vem de `recomendacao.motivo` (RN-08); o texto é da API, o front só o exibe e destaca o fator decisivo, se vier estruturado. Sem "garantimos"; a linguagem é condicional ("na sua simulação…").
4. **Alternar gráfico e tabela:** a tabela abaixo já é o equivalente textual; a alternância existe para quem prefere só a tabela (e para leitor de tela). Padrão: gráfico visível e tabela logo depois.
5. **Melhor regime** marcado por texto + ícone (não só cor ou negrito); linha "Total 2026–2033" cobre RN-08 (acumulado). Valor presente fica fora do MVP.
6. **Memória de cálculo** (RF-06, US-04): acordeão por ano (`<details>`/Disclosure), abas por regime (padrão APG). Ao abrir um ano, o primeiro regime aparece com o melhor destacado. Toda linha traz a fonte legal.
7. **Avisos** (`avisos[]`) em lista, com o ⚠️ equivalente a "conferir na fonte"; texto do aviso vem da API.

Cores: o mapeamento de regime → cor, marcador e estilo de linha está no [design system](../frontend/design-system.md). O gráfico **nunca** depende só de cor: cada série tem forma de marcador e traço distintos e rótulo direto na ponta da linha.

### Mobile

```
┌────────────────────────┐
│ Opta               ☰   │
│ ⓘ Premissas v2026.1    │
│ h1 Resultado           │
│ TI · SP · R$ 1,8 mi    │
│ [Ajustar] [Copiar link]│
│ ┌ Recomendação ───────┐│
│ │ Simples híbrido  ✓  ││
│ │ Economia 2026–2033: ││
│ │ R$ 214.300          ││
│ │ Por quê: 70% das... ││
│ │ [Ver como calculamos]│
│ └─────────────────────┘│
│ Carga por ano          │
│ (•)Gráfico ( )Tabela   │
│ [gráfico de linhas 280px│
│  toque mostra os valores│
│  do ano em um painel]  │
│ Comparativo            │
│ ┌ 2033 ────────────────┐│  ← 1 cartão por ano (8)
│ │ Simples    R$ 214,8 mil││
│ │ Híbrido ✓  R$ 181,5 mil││
│ │ Presumido  R$ 233,0 mil││
│ └──────────────────────┘│
│ ▸ Total 2026–2033       │
│ Memória de cálculo      │
│ ▸ 2026 ▸ 2027 ...       │
│ (linhas como lista de   │
│  definição, 1 por tributo)│
└────────────────────────┘
```

No mobile a tabela vira **cartões por ano** (o conteúdo semântico continua sendo uma tabela para tecnologias assistivas em telas largas; em telas estreitas usa-se lista de definição com a mesma ordem). A memória de cálculo mostra cada linha como bloco (Tributo, Base, Alíquota, Valor, Fonte), sem rolagem horizontal.

### Estados da tela 2

| Estado | Comportamento |
|---|---|
| Carregando | Esqueleto dos três blocos (`aria-busy`), texto "Calculando 8 anos e 3 regimes…"; foco já no `h1` |
| Sucesso | Foco move para o `h1`; título da página e `status` "Resultado pronto. Melhor regime: Simples híbrido." |
| Parcial (`SIM-002` ou 501) | Aviso por regime/ano indisponível; o resto continua |
| Erro | Callout "Não foi possível calcular agora" + [Tentar de novo] + [Ajustar dados] |
| Link inválido | Redireciona ao formulário com aviso |
| Empate | "Os regimes empatam em X; considere obrigações acessórias" (texto a validar com o backend, RN-08) [A CONFIRMAR] |
| Imprimir | Folha de estilo de impressão: sem navegação, tabela e memória expandidas, aviso legal no rodapé |

## 4. Tela 3 — Premissas e atividades (`/premissas`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ h1 Premissas de cálculo           Versão v2026.1 · cenário-base           │
│ As alíquotas finais ainda dependem de regulamentação (EC 132/2023,       │
│ LC 214/2025). Por isso são premissas configuráveis. [Ver fontes] (1)     │
│                                                                          │
│ h2 Transição por ano                                                     │
│ ┌──────┬─────────┬─────────┬───────────────┬──────────────────────────┐  │
│ │ Ano  │ CBS     │ IBS     │ ICMS/ISS      │ PIS/Cofins               │  │
│ │ 2026 │ 0,9%    │ 0,1%    │ vigentes      │ vigentes                 │  │
│ │ 2027 │ plena   │ 0,1%    │ vigentes      │ extintos                 │  │
│ │ …    │         │         │ 90% / 80%…    │                          │  │
│ │ 2033 │ plena   │ plena   │ extintos      │ extintos                 │  │
│ └──────┴─────────┴─────────┴───────────────┴──────────────────────────┘  │
│ (Valores ilustrativos; os reais vêm da API.)                             │
│                                                                          │
│ h2 Consultar atividade (CNAE)                                            │
│ [ digite o CNAE ou parte da descrição ▾ ]   [Consultar]                  │
│ ┌ 6201-5/01 · Desenvolvimento de programas de computador sob encomenda ┐ │
│ │ Anexo do Simples: V · Com Fator R (≥ 28%): III · Presunção IRPJ 32%  │ │
│ │ [Usar esta atividade no simulador] (2)                               │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

1. A tabela cobre RF-04/UC-02; as colunas aceitam texto ("plena", "extintos"), não só número.
2. A consulta de CNAE (RF-05/UC-03) pode levar a atividade ao simulador pelo fragmento.

Mobile: tabela com rolagem horizontal contida e primeira coluna fixa **ou** cartões por ano (preferir cartões, igual ao resultado). Estados: carregando (esqueleto), erro (callout + tentar de novo), sem resultado de CNAE.

## 5. Tela 4 — Metodologia (`/sobre`)

Conteúdo estático: o que o Opta faz e não faz, aviso legal completo, fontes legais (as da spec, seção 3.6), limites do MVP (serviços e comércio, sem ST, sem monofasia, sem Imposto Seletivo), como ler a memória de cálculo, versão das premissas, link para o repositório e para os ADRs. É a página que o recrutador lê para entender o rigor do projeto.

## 6. Microtextos-chave (PT-BR, tom direto e sem jargão desnecessário)

| Onde | Texto |
|---|---|
| Aviso global | "Simulador educacional. Não substitui o seu contador nem é consultoria tributária. Premissas v2026.1." |
| Botão principal | "Simular regimes" |
| Exemplo | "Preencher com um exemplo" |
| Híbrido, dica | "Simples híbrido: você segue no Simples, mas recolhe CBS e IBS fora do guia (DAS)." |
| Fator R | "Fator R aproximado: 30%. É a folha dividida pela receita; o cálculo oficial usa os últimos 12 meses." |
| B2B | "Quanto da sua receita vem de outras empresas? Elas conseguem usar o crédito de CBS/IBS que você cobra." |
| Erro geral do servidor | "Não conseguimos calcular agora. Seus dados foram mantidos. Tente de novo em instantes." |
| Estado vazio de CNAE | "Nenhuma atividade encontrada. Tente o código completo, como 6201-5/01." |
| Link copiado | "Link copiado. Ele contém os números que você digitou." |

Regras de escrita: moeda `R$ 1.234,56` (pt-BR), percentual `11,94%`, anos sempre com 4 dígitos, siglas explicadas na primeira ocorrência (CBS, IBS, DAS) com `<abbr>` e glossário na Metodologia.

## 7. Checklist de handoff para a implementação

- [ ] Tokens usados, sem valores literais (ver design system).
- [ ] Todos os estados das seções "Estados" desenhados e testáveis por parâmetro (`?estado=` no protótipo, apenas em desenvolvimento).
- [ ] Ordem de foco: pular link → navegação → h1 → formulário → botão.
- [ ] Textos finais revisados (sem promessa de economia, sempre condicional).
- [ ] Critérios de aceite ligados às histórias em [backlog-frontend.md](../frontend/backlog-frontend.md).
- [ ] Protótipo navegável com dados falsos tipados (FE-02/FE-04) testado com 5 pessoas antes de fechar o formulário.
