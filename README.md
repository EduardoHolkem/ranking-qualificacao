# Ranking de Qualificação

Painel estático feito com HTML, CSS e JavaScript puro, sem frameworks. Ele mostra um ranking de alunos por XP acumulado, com pódio, gráfico de projeção, mesa de comentaristas automática e um sistema de apostas com moedas virtuais.

Site publicado em https://eduardoholkem.github.io/ranking-qualificacao/

Todos os nomes de alunos neste repositório são fictícios.

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura da página. |
| `style.css` | Visual, cores e layout responsivo para celular. |
| `script.js` | Dados dos alunos, cálculos, gráfico e apostas. |

## Como atualizar os dados

Os dados ficam na lista `students`, no topo do `script.js`. Cada aluno tem o XP ganho em cada semana.

```js
{ name: "Ana Lima", weekly: [1141, 2268] },
```

Quando uma nova semana fechar, acrescente o valor no final do `weekly` de cada aluno. Depois ajuste os rótulos de data, que também ficam no `script.js`.

```js
const REAL_WEEK_LABELS = ["29/06", "06/07"];
const PROJECTED_WEEK_LABELS = ["13/07", "20/07", "27/07"];
```

O total de XP, a posição, os pontos, o status, o gráfico e os comentários são recalculados sozinhos. Só os rótulos de data precisam ser editados à mão.

## Regras de pontuação

O 1º lugar recebe 150 pontos, o 2º recebe 100, o 3º recebe 50 e do 4º em diante cada aluno recebe 30. Esses valores ficam em `RANKING_POINTS` e `DEFAULT_POINTS`.

A partir da 6ª posição o aluno entra na zona de eliminação, definida por `ELIMINATION_START`.

A projeção assume que a média semanal de XP de cada aluno se mantém nas próximas semanas. Ela é apenas uma estimativa, e semanas com zero XP puxam a média para baixo.

## Sistema de apostas

As apostas usam moeda virtual, guardada no `localStorage` do navegador de cada pessoa. O saldo inicial é de 1.000 moedas.

As odds dependem da fatia de XP de cada aluno, então quem tem mais XP paga menos. O botão de encerrar as apostas resolve todas as pendentes contra o líder atual, o que significa que apostar no líder sempre rende ganho.

Não há dinheiro real envolvido. Como o saldo fica no navegador, qualquer pessoa consegue alterá-lo.

## Limitações conhecidas

O campo "Última atualização" mostra a data de hoje do navegador, e não a data dos dados. Os rótulos de semana são fixos e precisam ser atualizados manualmente.

## Rodar localmente

Basta abrir o `index.html` no navegador, sem instalar nada.

## Publicar no GitHub Pages

1. No repositório, abra Settings e depois Pages.
2. Em "Build and deployment", deixe a opção Source como "Deploy from a branch".
3. Escolha a branch `main` e a pasta `/ (root)`, e salve.
4. Aguarde alguns minutos até o site aparecer no endereço do Pages.

Em repositório privado, o GitHub Pages só funciona em planos pagos. No plano gratuito o repositório precisa ser público.
