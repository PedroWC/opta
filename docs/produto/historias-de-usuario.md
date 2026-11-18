# Histórias de usuário

**US-01 — Comparar regimes.** Como empresário de serviços, quero informar meus números e ver a carga de cada regime de 2026 a 2033, para decidir onde ficar.
*Dado* um faturamento de R$ 1,8 mi e folha de R$ 540 mil, *quando* simulo, *então* vejo a carga total de cada regime por ano.

**US-02 — Saber quando vale o Simples híbrido.** Como empresário com clientes B2B, quero saber se compensa recolher CBS/IBS por fora do DAS, para não perder competitividade.
*Dado* 70% de vendas B2B e compras creditáveis, *quando* simulo, *então* a recomendação mostra o ganho acumulado e o fator decisivo.

**US-03 — Conhecer as premissas.** Como contador, quero ver as alíquotas de transição e a atividade do CNAE, para conferir as premissas do cálculo.

**US-04 — Auditar o cálculo.** Como contador, quero ver base, alíquota, valor e fonte legal de cada tributo, para validar o resultado.

**US-05 — Começar com um exemplo.** Como empresário que não sabe por onde começar, quero preencher o formulário com um exemplo, para ver como o resultado funciona antes de usar meus números.
*Dado* o formulário vazio, *quando* aciono "Preencher com um exemplo", *então* os campos recebem o cenário da US-01 e o leitor de tela anuncia que o exemplo foi preenchido.

**US-06 — Entender e corrigir erros.** Como empresário, quero mensagens claras de erro junto de cada campo, para corrigir sem perder o que já digitei.
*Dado* receita vazia e percentual B2B 120, *quando* envio, *então* vejo um resumo com 2 erros, o foco vai ao resumo, cada mensagem diz o que fazer e os demais campos continuam preenchidos.

**US-07 — Compartilhar e reabrir.** Como empresário, quero copiar um link do resultado para mostrar ao meu contador, sem criar conta.
*Dado* um resultado exibido, *quando* copio o link e o abro em outra aba, *então* vejo a mesma simulação; e *dado* um link com dado inválido, *então* caio no formulário com aviso e os campos válidos preenchidos.

**US-08 — Usar no celular.** Como empresário, quero simular e ler o resultado no celular, sem rolagem horizontal.
*Dado* uma tela de 320 px, *quando* abro o resultado, *então* tabela e memória de cálculo aparecem como cartões legíveis e o gráfico cabe na largura.

**US-09 — Usar com teclado e leitor de tela.** Como pessoa que usa tecnologia assistiva, quero concluir uma simulação e ler o resultado sem mouse.
*Dado* um leitor de tela e só o teclado, *quando* sigo o fluxo da US-01, *então* consigo preencher, enviar, ouvir a recomendação, ler a tabela equivalente ao gráfico e abrir a memória de cálculo.

**US-10 — Consultar atividade e premissas na interface.** Como contador, quero consultar o CNAE e as alíquotas de transição por ano sem fazer uma simulação, para conferir as premissas (complementa a US-03).
