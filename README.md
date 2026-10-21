# Ranking de Qualificação

Painel estático (HTML, CSS e JavaScript puro, sem frameworks) que mostra um ranking de alunos por XP acumulado, com pódio, gráfico de projeção, mesa de comentaristas automática e um sistema de apostas com moedas virtuais.

> Todos os nomes de alunos neste repositório são fictícios.

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura da página. |
| `style.css` | Visual (cores, layout, responsivo para celular). |
| `script.js` | Dados dos alunos, cálculos, gráfico e apostas. |

## Como atualizar os dados

Edite a lista `students` no topo do `script.js`. Cada aluno tem o XP ganho em cada semana.

```js
{ name: "Ana Lima", weekly: [1141, 2268] },
```

Ao fechar uma nova semana, acrescente o valor no final do `weekly` de cada aluno e atualize os rótulos de datas.

```js
const REAL_WEEK_LABELS = ["29/06", "06/07"];
const PROJECTED_WEEK_LABELS = ["13/07", "20/07", "27/07"];
```

Total de XP, posição, pontos, status, gráfico e comentários são recalculados sozinhos.

## Regras de pontuação

- 1º lugar recebe 150 pontos, 2º recebe 100, 3º recebe 50 e do 4º em diante 30 (`RANKING_POINTS` e `DEFAULT_POINTS`).
- A partir da 6ª posição o aluno entra na zona de eliminação (`ELIMINATION_START`).
- A projeção assume que a média semanal de XP se mantém. É uma estimativa.

## Sistema de apostas

Moeda virtual guardada no `localStorage` do navegador de cada pessoa. Começa com 1.000 moedas. As odds dependem da fatia de XP de cada aluno e o botão de encerrar resolve as apostas pendentes contra o líder atual. Não envolve dinheiro real e o saldo pode ser editado por quem usa o navegador.

## Observações conhecidas

- O campo "Última atualização" mostra a data de hoje do navegador, não a data dos dados.
- Os rótulos de semana são fixos e precisam ser atualizados à mão.

## Rodar localmente

Basta abrir o `index.html` no navegador. Para publicar, use o GitHub Pages (Settings → Pages → Branch `main`, pasta `/ (root)`). Em repositório privado, o Pages depende do plano da conta.
