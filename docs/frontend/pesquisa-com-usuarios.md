# Pesquisa e teste com usuários (front-end)

> **Status:** plano. Tudo o que descreve pessoas abaixo é **hipótese** a validar; ainda não há entrevistas. Contexto: [plano do front-end](plano-frontend.md).

## 1. Hipóteses de persona

| | Marina (empresária) | Rogério (contador) |
|---|---|---|
| Perfil | Dona de empresa de serviços com 3 a 10 pessoas, 35–55 anos | Contador de pequenas empresas, 40–60 anos |
| Dispositivo | Celular e notebook | Desktop com duas telas |
| Conhecimento | Sabe o faturamento; não sabe o que é CBS/IBS nem Fator R | Domina Simples e Presumido; está aprendendo a Reforma |
| Objetivo | Decidir sem ser enganada; levar um número ao contador | Conferir cálculo e ter referência legal |
| Medo | "Vou escolher errado e pagar mais" | "Ferramenta sem fonte não serve" |
| Tarefa-chave | Simular e entender a recomendação (US-01, US-02) | Auditar a memória de cálculo (US-04) e consultar premissas (US-03) |

Hipóteses de comportamento a testar: (H1) a maioria não terá a folha anual à mão e vai estimar; (H2) o termo "B2B" não é entendido sem explicação; (H3) a recomendação só é confiável se o motivo for claro e houver aviso legal visível; (H4) contador quer ver a fonte legal e a alíquota efetiva antes de confiar.

## 2. Tarefas do teste de usabilidade (protótipo navegável com dados falsos)

| # | Tarefa (sem usar os nomes dos botões) | Sucesso | Métrica |
|---|---|---|---|
| T1 | "Descubra em que regime sua empresa de TI, com R$ 1,8 mi de receita, deveria ficar." | Chega à recomendação sozinho | Taxa de conclusão; tempo (meta ≤ 3 min) |
| T2 | "Explique com suas palavras por que o Opta recomendou esse regime." | Cita o fator decisivo (clientes B2B/crédito) | Compreensão (0/1/2) |
| T3 | "E se só 20% das vendas fossem para empresas? Veja o que muda." | Volta, ajusta e compara | Passos; erros |
| T4 | "Encontre quanto a empresa pagaria de DAS em 2030 e de onde vem esse número." | Abre a memória de cálculo e acha a fonte | Tempo; sucesso |
| T5 | "Envie esse resultado para seu contador." | Copia o link | Sucesso; leu o aviso? |
| T6 | "Veja qual será a alíquota de CBS em 2027." | Acha em Premissas | Tempo |

Rodada extra com teclado e leitor de tela (T1 e T4) com ao menos uma pessoa que usa tecnologia assistiva, se possível.

## 3. Plano para 5 pessoas

- **Recrutamento:** 3 empresários(as) ou sócios(as) de pequenas empresas de serviços e 2 contadores(as), fora do círculo de quem construiu o produto. Critério de exclusão: já usou o Opta.
- **Formato:** 30 a 40 minutos, remoto ou presencial, pensar em voz alta, sem ajuda; uma pessoa conduz, outra anota. Gravar só com consentimento; nunca pedir dados reais de empresas (usar o exemplo).
- **Roteiro:** (1) acolhimento e consentimento (2 min); (2) perguntas de contexto: como decide regime hoje? (5 min); (3) tarefas T1 a T6 (20 min); (4) perguntas finais: o que confundiu? você confiaria? o que faltou? (5 min); (5) escala SUS curta (10 itens) ou "Quão fácil foi?" de 1 a 7 (2 min).
- **Resultado:** com 5 pessoas, problemas que afetam ≥ 3 delas são prioridade; registrar cada achado com gravidade (cosmético, médio, grave, bloqueante), evidência e correção proposta.
- **Quando:** (a) rodada rápida no protótipo da Tela 1 e 2 antes de implementar o formulário (FE-06); (b) rodada final antes do deploy (#14), em versão implementada.
- **Critério de saída para o MVP:** ≥ 4 de 5 concluem T1 sem ajuda em ≤ 3 minutos; ≥ 4 de 5 explicam o motivo da recomendação (T2); nenhum problema bloqueante aberto; SUS ≥ 68 ou nota ≥ 5,5/7.

## 4. Perguntas em aberto para o Pedro

1. Há pessoas reais (conhecidos que sejam empresários ou contadores) para recrutar, sem constrangimento de relacionamento?
2. ~~Foco da demo?~~ **Decidido:** empresário, com linguagem simples; o contador é atendido pela memória de cálculo e pela metodologia.
3. Há restrição de privacidade para gravar as sessões?
