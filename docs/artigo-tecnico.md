# Como construí o Opta: um simulador de regimes tributários com domínio rico e testes honestos

> Artigo técnico do projeto de portfólio [Opta](../README.md). Simulador educacional, **não é consultoria tributária**; os pontos que ainda precisam de conferência legal estão listados no fim.

A Reforma Tributária do Consumo troca, entre 2026 e 2033, PIS, Cofins, ICMS e ISS por CBS e IBS, com uma transição gradual. Para uma pequena empresa, a pergunta prática é: **continuo no Simples, recolho CBS/IBS por fora do DAS ou migro para o Lucro Presumido?** O Opta responde isso ano a ano. Este texto conta as decisões de engenharia por trás dele, incluindo o que deu errado e o que ainda não foi feito.

## 1. O problema de modelagem

O cálculo parece simples até a transição entrar. O mesmo DAS, por exemplo, tem **total constante** ao longo dos anos, mas **composição** que muda: a parcela de PIS/Cofins vira CBS a partir de 2027, e a de ISS cede ao IBS à medida que o ICMS/ISS é extinto. No Simples híbrido, essas parcelas saem do DAS e passam a ser apuradas como débito menos crédito no regime regular. Quem compra de uma empresa do Simples puro só aproveita o crédito embutido no DAS; no híbrido, o crédito é cheio. Esse último ponto é o diferencial do produto, e ele só aparece se o modelo for fiel.

A solução foi um domínio pequeno e explícito:

- **`TaxRegime` com Template Method**: `simulate()` é fixo, e cada regime só informa quais tributos aplica. `SimplesHibrido` **herda** de `SimplesNacional` porque é, de fato, um Simples (a única herança relevante; o resto é composição).
- **`TaxStrategy` por tributo**: `DasStrategy`, `CbsStrategy`, `IbsStrategy`, `IrpjStrategy` e assim por diante. CBS, IBS e ICMS compartilham o esqueleto "débito menos crédito" em uma classe base; ISS e PIS/Cofins, sem crédito, são estratégias simples.
- **Memória de cálculo como parte do modelo**: cada `TaxLine` carrega base, alíquota, valor e fonte legal, e pode ter um detalhamento (a partilha do DAS, o débito e o crédito) que **não entra na soma**. A interface só desenha o que o domínio já produziu.
- **Backend 100% orientado a objetos**, imposto por lint: o ESLint proíbe funções e constantes exportadas soltas fora do bootstrap, e o `dependency-cruiser` impede o domínio de importar HTTP ou banco ([ADR-0001](arquitetura/adr/0001-backend-100-orientado-a-objetos.md)).

## 2. Precisão numérica e vigência

Dinheiro em `number` é fonte clássica de erro de centavos. No Opta, `Money` guarda `bigint` em centavos, e `TaxRate` guarda a alíquota como inteiro em milionésimos, com arredondamento meio para cima concentrado em um único lugar ([ADR-0003](arquitetura/adr/0003-precisao-numerica.md)). A alíquota efetiva do Simples, `(RBT12 × nominal − parcela a deduzir) ÷ RBT12`, é calculada com inteiros antes de arredondar a quatro casas. Uma propriedade de teste garante que o erro de arredondamento de qualquer multiplicação é de no máximo meio centavo.

A legislação muda, então **nada fiscal vive no código**. Faixas, alíquotas, partilhas e parâmetros ficam em tabelas com início e fim de vigência, atrás de uma porta de repositório ([ADR-0004](arquitetura/adr/0004-parametros-fiscais-com-vigencia.md)). O mesmo repositório SQL roda em SQLite e em Oracle (SQL portável, sempre com *bind variables*), e a **mesma suíte de contrato** roda contra o repositório em memória e o SQLite, comparando inclusive o acumulado dos três regimes. Mudar a lei é encerrar uma linha e inserir outra, e há teste disso.

## 3. Como saber se o cálculo está certo

Esta foi a parte em que mais investi, em três camadas que se complementam:

1. **Casos "golden" conferidos à mão.** Para uma empresa de serviços com R$ 300 mil de receita, o DAS de 2026 sai R$ 24.240,00 (alíquota efetiva de 8,08%), e a partilha, o híbrido e o Lucro Presumido de cada ano foram calculados em papel antes de virarem teste. O acumulado de 2026 a 2033 (R$ 193.920,00, R$ 324.351,12 e R$ 460.230,00) é um teste de ponta a ponta. Quando o teste e a conta à mão divergiram, quase sempre era a conta.
2. **Propriedades** (fast-check): a alíquota efetiva nunca é negativa nem passa da nominal; até o sublimite de R$ 3,6 milhões ela não diminui quando a receita aumenta; a partilha do DAS soma exatamente o DAS; o DAS é igual nos oito anos; o DAS do híbrido nunca é maior que o do puro; o crédito integral nunca é menor que o embutido; e a API nunca responde 500 a uma entrada arbitrária. **Uma dessas propriedades achou uma limitação real**: acima de R$ 3,6 milhões a alíquota efetiva *cai*, porque o ISS/ICMS saem do DAS. Isso virou aviso na API e nota na documentação.
3. **Mutação** (Stryker): a linha de base de 83,84% subiu para **90,05%** depois de testar mensagens, rótulos, validações e fontes legais. O limiar de 85% está em um ADR e fora do `npm run check`, por ser lento ([ADR-0007](arquitetura/adr/0007-testes-de-propriedades-e-mutacao.md)).

Cobertura de linhas sozinha teria dito "100%" muito antes de eu confiar no resultado.

## 4. O contrato vem primeiro

O OpenAPI 3.1 foi escrito antes dos controllers, incorporando pedidos do front-end (erros por campo no 422, dinheiro e alíquotas como **texto decimal**, busca de atividade, fator decisivo estruturado). Depois, os testes validam **a resposta real** contra o schema com Ajv, e o front gera seus tipos do mesmo arquivo; o CI falha se o arquivo gerado divergir. Um regime que não se aplica (receita acima do teto do Simples) não derruba a simulação: vai em `regimes_indisponiveis`, e os demais continuam. Erros seguem Problem Details (RFC 9457) com códigos estáveis.

## 5. Acessibilidade como requisito verificado

A interface é uma SPA em React. Acessibilidade foi tratada como requisito com teste, em duas camadas:

- **No jsdom**, `axe-core` em todas as telas, testes de teclado (combobox no padrão APG, abas com setas) e de papéis e nomes. O jsdom não calcula contraste, então um teste lê os próprios CSS e confere cada par de cores nos temas claro e escuro.
- **No navegador real** (Playwright, desktop e celular): axe com layout e cores reais, alvos de toque, foco visível em cada elemento, espaçamento de texto da WCAG, zoom e rolagem horizontal em 320 px.

A segunda camada se pagou. Os E2E acharam **quatro defeitos que a primeira não pegava**: o React Hook Form tirava o foco do resumo de erros e o levava ao primeiro campo; em StrictMode, o anunciador de rota focava o conteúdo na carga inicial e fazia o *Tab* pular a navegação; as abas da memória de cálculo estouravam 320 px; e o CI no Linux, com uma fonte do sistema mais larga, revelou que o layout e os `fieldset` não encolhiam. Esse último não aparecia no meu Mac, então o teste agora força uma fonte larga. Na auditoria final sobraram ainda links de rodapé pequenos e a memória de cálculo que não saía expandida na impressão.

O gráfico (Recharts, carregado sob demanda) nunca depende só de cor: cada regime tem cor, marcador, traço e rótulo direto, e a tabela equivalente fica sempre à vista.

## 6. Segurança e privacidade

- **Dados no fragmento da URL**: o link compartilhável carrega a simulação em `#v1.<base64url>`, que o navegador não envia ao servidor. O front **não confia no link**: valida cada campo com o mesmo esquema do formulário, descarta o que não passa e abre o formulário com os campos válidos e um aviso.
- **Mesma origem e CSP restritiva** ([ADR-0008](arquitetura/adr/0008-front-servido-pela-api-sob-a-mesma-origem.md)): a API serve o build estático, sem CORS, com `script-src 'self'`, sem `unsafe-eval`, e mais os cabeçalhos habituais. Ao ligar a CSP, o E2E de produção acusou uma violação: o **Zod 4 sondava `new Function`** para compilar esquemas. Desliguei o modo JIT (`jitless`), com o mesmo comportamento.
- O servidor de arquivos estáticos recusa caminhos fora da pasta, nunca devolve HTML para rotas da API e tem teste para cada tentativa de travessia.

## 7. Processo

Tudo passou por issue, branch `tipo/N-slug`, PR com CI verde e *squash*. A documentação (ERS, regras de negócio, casos de uso, histórias, ADRs e a **matriz de rastreabilidade** de requisito para teste) é atualizada no mesmo PR da mudança; o nome de cada teste leva o ID que ele cobre (por exemplo, `RN-04: ...`). O CI roda quatro jobs: backend, interface, E2E em desenvolvimento e E2E no build de produção, este último com orçamento de JS inicial (200 KB gzip), LCP e CLS.

## 8. O que ainda não está pronto

Honestidade técnica importa mais que a vitrine:

- **Tabelas fiscais não conferidas na fonte.** A partilha do DAS dos Anexos III e V foi escrita de memória (soma 100% em todas as faixas, mas não foi conferida), e as premissas de CBS/IBS, as presunções e o mapa de CNAE são de referência. Está marcado com ⚠️ em toda a documentação e na issue #60. Até lá, os números do Opta ilustram o mecanismo; não servem de base para decisão real.
- **Oracle só com conexão falsa**: o DDL e o adaptador existem e têm teste de contrato do lado do SQL, mas não rodaram em um Oracle de verdade (issue #59).
- **Leitor de tela real e teste com pessoas**: não foram feitos. Os testes automatizados cobrem papéis, nomes e anúncios, mas o comportamento real varia por leitor. Não afirmo que a interface foi testada com usuários.
- **Escopo**: Simples só dos Anexos III e V, comércio só no Lucro Presumido, sem ISS/ICMS fora do DAS acima de R$ 3,6 milhões.
- **Demonstração pública** ainda não publicada.

## 9. O que eu faria de novo

Escrever o contrato antes do código, testar a conta à mão antes de testar o código, e tratar o navegador real como a fonte da verdade de acessibilidade. O que eu faria diferente: pedir a conferência jurídica das tabelas **no início**, não no fim, porque é o risco que mais pesa e o único que testes não eliminam.
