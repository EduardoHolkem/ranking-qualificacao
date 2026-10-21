/* ==========================================================================
   CODDY TECH — RANKING DE QUALIFICAÇÃO
   Toda a lógica de dados, ordenação, gráfico de projeção e renderização.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1) BASE DE DADOS DOS ALUNOS
   --------------------------------------------------------------------------
   "weekly" = XP ganho em cada semana já registrada (vindo da planilha).
   Para atualizar, adicione o XP da nova semana no final do array "weekly"
   de cada aluno — o total, a posição, os pontos e o gráfico de projeção
   são recalculados automaticamente.
-------------------------------------------------------------------------- */
const students = [
  { name: "Ana Lima",    weekly: [1141, 2268] },
  { name: "Bruno Costa",    weekly: [0, 2064] },
  { name: "Carla Souza",       weekly: [1097, 0] },
  { name: "Diego Alves",      weekly: [279, 757] },
  { name: "Elisa Rocha",         weekly: [280, 0] },
  { name: "Felipe Duarte", weekly: [109, 0] },
];

/* Rótulos das semanas já ocorridas + semanas futuras projetadas */
const REAL_WEEK_LABELS = ["29/06", "06/07"];
const PROJECTED_WEEK_LABELS = ["13/07", "20/07", "27/07"];
const ALL_WEEK_LABELS = [...REAL_WEEK_LABELS, ...PROJECTED_WEEK_LABELS];

/* Pontuação distribuída conforme a posição final no ranking */
const RANKING_POINTS = { 1: 150, 2: 100, 3: 50 };
const DEFAULT_POINTS = 30; // 4º lugar em diante

/* A partir desta posição, o aluno entra na zona de eliminação */
const ELIMINATION_START = 6;

/* Sistema de apostas: saldo inicial e chaves de armazenamento local */
const STARTING_BALANCE = 1000;
const STORAGE_BALANCE_KEY = "coddytech_bet_balance";
const STORAGE_BETS_KEY = "coddytech_bets";

/* Paleta de cores do gráfico (uma cor por aluno) */
const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];

/* --------------------------------------------------------------------------
   2) PROCESSAMENTO: XP total, ordenação, posição, pontos, medalha e status
-------------------------------------------------------------------------- */
function totalXp(student){
  return student.weekly.reduce((sum, v) => sum + v, 0);
}

function buildRanking(data){
  const withTotals = data.map(s => ({ ...s, xp: totalXp(s) }));
  const sorted = [...withTotals].sort((a, b) => b.xp - a.xp);
  const maxXp = sorted[0]?.xp || 1;

  return sorted.map((student, index) => {
    const position = index + 1;
    const points = RANKING_POINTS[position] ?? DEFAULT_POINTS;
    return {
      ...student,
      position,
      points,
      progress: Math.round((student.xp / maxXp) * 100),
      medal: getMedal(position),
      status: getStatus(position, sorted.length),
      initial: student.name.trim().charAt(0).toUpperCase(),
    };
  });
}

function getMedal(position){
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return null;
}

function getStatus(position, total){
  if (isEliminationZone(position)) return { label: "Eliminação", icon: "💀", key: "eliminacao" };
  if (position === 1) return { label: "Líder", icon: "🔥", key: "lider" };
  if (position <= 3) return { label: "Subindo", icon: "🚀", key: "subindo" };
  if (position <= Math.ceil(total * 0.66)) return { label: "Competindo", icon: "⚡", key: "competindo" };
  return { label: "Evoluindo", icon: "📈", key: "evoluindo" };
}

function isEliminationZone(position){
  return position >= ELIMINATION_START;
}

/* --------------------------------------------------------------------------
   3) PROJEÇÃO DE DESEMPENHO
   --------------------------------------------------------------------------
   Para cada aluno, calcula o XP acumulado por semana e projeta as próximas
   semanas assumindo que o ritmo médio semanal (XP ganho / semanas) se
   mantém constante. É uma estimativa, não uma garantia.
-------------------------------------------------------------------------- */
function buildProjection(data){
  return data.map(student => {
    const weekly = student.weekly;
    const avgGain = weekly.reduce((s, v) => s + v, 0) / weekly.length;

    // XP acumulado real
    const cumulative = [];
    let running = 0;
    weekly.forEach(v => { running += v; cumulative.push(running); });

    // Projeção das próximas semanas com base na média semanal
    const projected = [];
    let base = running;
    for (let i = 0; i < PROJECTED_WEEK_LABELS.length; i++){
      base += avgGain;
      projected.push(Math.round(base));
    }

    return {
      name: student.name,
      real: cumulative,
      projected,
      series: [...cumulative, ...projected],
    };
  });
}

/* --------------------------------------------------------------------------
   4) ESTADO
-------------------------------------------------------------------------- */
let ranking = buildRanking(students);
let projection = buildProjection(students);
let currentFilter = "todos";
let currentSearch = "";
let hiddenSeries = new Set(); // nomes ocultos no gráfico

/* --------------------------------------------------------------------------
   5) HELPERS DE FORMATAÇÃO
-------------------------------------------------------------------------- */
const formatNumber = (n) => n.toLocaleString("pt-BR");

function applyFilters(list){
  let result = list;

  if (currentFilter === "top3") result = result.filter(s => s.position <= 3);
  else if (currentFilter === "top5") result = result.filter(s => s.position <= 5);
  else if (currentFilter === "demais") result = result.filter(s => s.position > 3);

  if (currentSearch.trim() !== ""){
    const q = currentSearch.trim().toLowerCase();
    result = result.filter(s => s.name.toLowerCase().includes(q));
  }

  return result;
}

/* --------------------------------------------------------------------------
   6) RENDER: CARDS DE RESUMO
-------------------------------------------------------------------------- */
function renderCards(){
  const leader = ranking[0];
  const totalXpSum = ranking.reduce((sum, s) => sum + s.xp, 0);
  const totalStudents = ranking.length;
  const avgXp = Math.round(totalXpSum / totalStudents);

  const cardsGrid = document.getElementById("cards-grid");
  cardsGrid.innerHTML = `
    <div class="info-card" style="animation-delay:0.05s">
      <span class="info-card-icon">🏆</span>
      <span class="info-card-label">Líder Atual</span>
      <span class="info-card-value">${leader.name}</span>
      <span class="info-card-sub">${formatNumber(leader.xp)} XP</span>
    </div>
    <div class="info-card" style="animation-delay:0.12s">
      <span class="info-card-icon">📈</span>
      <span class="info-card-label">Total de XP</span>
      <span class="info-card-value mono" id="counter-total-xp">0</span>
      <span class="info-card-sub">acumulado pela turma</span>
    </div>
    <div class="info-card" style="animation-delay:0.19s">
      <span class="info-card-icon">👥</span>
      <span class="info-card-label">Total de Alunos</span>
      <span class="info-card-value mono" id="counter-total-students">0</span>
      <span class="info-card-sub">em qualificação</span>
    </div>
    <div class="info-card" style="animation-delay:0.26s">
      <span class="info-card-icon">⭐</span>
      <span class="info-card-label">Média de XP</span>
      <span class="info-card-value mono" id="counter-avg-xp">0</span>
      <span class="info-card-sub">por aluno</span>
    </div>
  `;

  animateCounter("counter-total-xp", totalXpSum);
  animateCounter("counter-total-students", totalStudents);
  animateCounter("counter-avg-xp", avgXp);
}

/* Contador animado de XP (efeito "odômetro") */
function animateCounter(elementId, target, duration = 1200){
  const el = document.getElementById(elementId);
  if (!el) return;
  const start = 0;
  const startTime = performance.now();

  function tick(now){
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    const value = Math.round(start + (target - start) * eased);
    el.textContent = formatNumber(value);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* --------------------------------------------------------------------------
   7) RENDER: PÓDIO (top 3)
-------------------------------------------------------------------------- */
function renderPodium(){
  const top3 = ranking.slice(0, 3);
  const podium = document.getElementById("podium");
  const crowns = { 1: "👑", 2: "", 3: "" };

  podium.innerHTML = top3.map(s => `
    <div class="podium-place place-${s.position}">
      ${s.position === 1 ? `<span class="podium-crown">${crowns[1]}</span>` : ""}
      <div class="podium-avatar">${s.initial}</div>
      <div class="podium-name">${s.name}</div>
      <div class="podium-xp">${formatNumber(s.xp)} XP</div>
      <div class="podium-block">${s.medal}</div>
    </div>
  `).join("");
}

/* --------------------------------------------------------------------------
   8) RENDER: RANKING PRINCIPAL
-------------------------------------------------------------------------- */
function renderRankingList(){
  const container = document.getElementById("ranking-list");
  const emptyState = document.getElementById("empty-state-ranking");
  const list = applyFilters(ranking);

  if (list.length === 0){
    container.innerHTML = "";
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  let html = "";
  let dividerShown = false;

  list.forEach((s, i) => {
    const elim = isEliminationZone(s.position);

    // Insere o divisor da zona de eliminação assim que o primeiro aluno
    // eliminado aparece na lista filtrada atual.
    if (elim && !dividerShown){
      html += `<div class="elimination-divider" style="animation-delay:${0.05 * i}s">⚠️ Zona de Eliminação</div>`;
      dividerShown = true;
    }

    const topClass = s.position <= 3 ? `top${s.position}` : "";
    const elimClass = elim ? "elim-zone" : "";
    const medalHtml = s.medal
      ? `<span class="rank-medal">${s.medal}</span>`
      : `<span class="rank-medal" style="font-size:14px;color:var(--text-dimmer);font-weight:700;">#${s.position}</span>`;

    html += `
      <div class="rank-row ${topClass} ${elimClass}" style="animation-delay:${0.05 * i}s">
        <div class="rank-position">${s.position}</div>
        ${medalHtml}
        <div class="rank-avatar">${s.initial}</div>
        <div class="rank-info">
          <div class="rank-name-line">
            <span class="rank-name">${s.name}</span>
            <span class="rank-xp-text">${formatNumber(s.xp)} XP</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" data-progress="${s.progress}"></div>
          </div>
        </div>
        <div class="rank-points">
          <span class="rank-points-value">+${s.points}</span>
          <span class="rank-points-label">pontos</span>
        </div>
        <div class="rank-status">${s.status.icon} ${s.status.label}</div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Anima as barras de progresso após a inserção no DOM
  requestAnimationFrame(() => {
    document.querySelectorAll(".progress-fill").forEach(bar => {
      const value = bar.getAttribute("data-progress");
      setTimeout(() => { bar.style.width = `${value}%`; }, 150);
    });
  });
}

/* --------------------------------------------------------------------------
   9) RENDER: GRÁFICO DE PROJEÇÃO (SVG puro, sem bibliotecas)
-------------------------------------------------------------------------- */
function renderChart(){
  const holder = document.getElementById("chart-holder");
  const legendEl = document.getElementById("chart-legend");

  const width = 720, height = 300;
  const marginLeft = 44, marginRight = 14, marginTop = 16, marginBottom = 34;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const n = ALL_WEEK_LABELS.length;
  const maxVal = Math.max(...projection.flatMap(p => p.series)) * 1.12;

  const xAt = (i) => marginLeft + (i / (n - 1)) * plotWidth;
  const yAt = (v) => marginTop + plotHeight - (v / maxVal) * plotHeight;

  /* --- Grid horizontal + rótulos do eixo Y --- */
  const gridLines = 4;
  let gridSvg = "";
  for (let g = 0; g <= gridLines; g++){
    const val = Math.round((maxVal / gridLines) * g);
    const y = yAt(val);
    gridSvg += `<line class="chart-grid-line" x1="${marginLeft}" y1="${y}" x2="${width - marginRight}" y2="${y}"></line>`;
    gridSvg += `<text class="chart-axis-label" x="${marginLeft - 8}" y="${y + 3}" text-anchor="end">${formatNumber(val)}</text>`;
  }

  /* --- Rótulos do eixo X --- */
  let xLabelsSvg = "";
  ALL_WEEK_LABELS.forEach((label, i) => {
    xLabelsSvg += `<text class="chart-axis-label" x="${xAt(i)}" y="${height - 10}" text-anchor="middle">${label}</text>`;
  });

  /* --- Linha divisória entre "real" e "projeção" --- */
  const dividerX = xAt(REAL_WEEK_LABELS.length - 1);
  const dividerSvg = `
    <line class="chart-divider" x1="${dividerX}" y1="${marginTop}" x2="${dividerX}" y2="${height - marginBottom}"></line>
    <text class="chart-zone-label" x="${xAt(n - 1)}" y="${marginTop + 12}" text-anchor="end">Projeção</text>
  `;

  /* --- Séries (uma por aluno) --- */
  let seriesSvg = "";
  projection.forEach((p, idx) => {
    const color = CHART_COLORS[idx % CHART_COLORS.length];
    const realPoints = p.real.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
    // segmento projetado inclui o último ponto real como início, para continuidade visual
    const projStart = { i: p.real.length - 1, v: p.real[p.real.length - 1] };
    const projPoints = [`${xAt(projStart.i)},${yAt(projStart.v)}`]
      .concat(p.projected.map((v, i) => `${xAt(p.real.length + i)},${yAt(v)}`))
      .join(" ");

    const realCircles = p.real.map((v, i) => `<circle class="chart-point" cx="${xAt(i)}" cy="${yAt(v)}" r="4" fill="${color}"></circle>`).join("");
    const projCircles = p.projected.map((v, i) => `<circle class="chart-point" cx="${xAt(p.real.length + i)}" cy="${yAt(v)}" r="3.5" fill="${color}" fill-opacity="0.35" stroke="${color}" stroke-width="1.5"></circle>`).join("");

    seriesSvg += `
      <g class="chart-series" data-name="${p.name}">
        <polyline class="chart-line real" points="${realPoints}" stroke="${color}"></polyline>
        <polyline class="chart-line projected" points="${projPoints}" stroke="${color}"></polyline>
        ${realCircles}
        ${projCircles}
      </g>
    `;
  });

  holder.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${gridSvg}
      ${dividerSvg}
      ${seriesSvg}
      ${xLabelsSvg}
    </svg>
  `;

  /* --- Anima o desenho das linhas (stroke-dashoffset) --- */
  requestAnimationFrame(() => {
    holder.querySelectorAll(".chart-line").forEach(line => {
      const length = line.getTotalLength();
      const isProjected = line.classList.contains("projected");
      line.style.strokeDasharray = `${length}`;
      line.style.strokeDashoffset = `${length}`;
      line.style.transition = "none";
      requestAnimationFrame(() => {
        line.style.transition = `stroke-dashoffset 1.1s var(--ease-fluid) ${isProjected ? "0.5s" : "0.1s"}`;
        line.style.strokeDashoffset = "0";
        if (isProjected){
          line.addEventListener("transitionend", function handler(){
            line.style.strokeDasharray = "6 6";
            line.removeEventListener("transitionend", handler);
          }, { once: true });
        }
      });
    });
  });

  /* --- Legenda interativa (clique para comparar alunos) --- */
  legendEl.innerHTML = projection.map((p, idx) => {
    const color = CHART_COLORS[idx % CHART_COLORS.length];
    const finalXp = p.series[p.series.length - 1];
    const isHidden = hiddenSeries.has(p.name);
    return `
      <div class="legend-item ${isHidden ? "inactive" : ""}" data-name="${p.name}">
        <span class="legend-swatch" style="background:${color}"></span>
        <span>${p.name}</span>
        <span class="legend-value">${formatNumber(finalXp)}</span>
      </div>
    `;
  }).join("");

  legendEl.querySelectorAll(".legend-item").forEach(item => {
    item.addEventListener("click", () => {
      const name = item.dataset.name;
      if (hiddenSeries.has(name)) hiddenSeries.delete(name);
      else hiddenSeries.add(name);
      item.classList.toggle("inactive");
      const seriesGroup = holder.querySelector(`.chart-series[data-name="${CSS.escape(name)}"]`);
      if (seriesGroup) seriesGroup.classList.toggle("hidden");
    });
  });
}

/* --------------------------------------------------------------------------
   9b) SISTEMA DE APOSTAS
   --------------------------------------------------------------------------
   Moeda virtual guardada no localStorage do navegador. As odds (multiplicador
   de retorno) são calculadas com base na fatia de XP de cada aluno: quem
   tem mais XP paga menos (é o favorito), quem tem menos XP paga mais
   (é o azarão).
-------------------------------------------------------------------------- */
function getOdds(student){
  const totalXpSum = ranking.reduce((sum, s) => sum + s.xp, 0) || 1;
  const share = (student.xp || 1) / totalXpSum;
  const raw = (1 / share) * 0.85; // aplica uma margem de "casa"
  return Math.min(20, Math.max(1.3, raw)).toFixed(2);
}

function loadBalance(){
  const stored = localStorage.getItem(STORAGE_BALANCE_KEY);
  return stored !== null ? parseInt(stored, 10) : STARTING_BALANCE;
}
function saveBalance(value){ localStorage.setItem(STORAGE_BALANCE_KEY, String(value)); }

function loadBets(){
  try{
    const stored = localStorage.getItem(STORAGE_BETS_KEY);
    return stored ? JSON.parse(stored) : [];
  }catch(e){ return []; }
}
function saveBets(bets){ localStorage.setItem(STORAGE_BETS_KEY, JSON.stringify(bets)); }

let betBalance = loadBalance();
let myBets = loadBets();

function renderBettingGrid(){
  const grid = document.getElementById("betting-grid");
  grid.innerHTML = ranking.map((s, i) => `
    <div class="bet-row" style="animation-delay:${0.05 * i}s">
      <div class="bet-avatar">${s.initial}</div>
      <div class="bet-name">${s.name}</div>
      <div class="bet-odds">${getOdds(s)}x<span class="bet-odds-label">odds</span></div>
      <input type="number" class="bet-input" min="10" step="10" placeholder="Moedas" data-name="${s.name}">
      <button class="bet-btn" data-name="${s.name}">Apostar</button>
    </div>
  `).join("");

  grid.querySelectorAll(".bet-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      const input = grid.querySelector(`.bet-input[data-name="${CSS.escape(name)}"]`);
      const amount = parseInt(input.value, 10);
      placeBet(name, amount);
      input.value = "";
    });
  });
}

function placeBet(name, amount){
  if (!amount || amount <= 0){
    alert("Digite um valor válido de moedas para apostar.");
    return;
  }
  if (amount > betBalance){
    alert("Saldo insuficiente para essa aposta.");
    return;
  }

  const student = ranking.find(s => s.name === name);
  const odds = parseFloat(getOdds(student));

  betBalance -= amount;
  saveBalance(betBalance);

  myBets.unshift({
    id: Date.now(),
    name,
    amount,
    odds,
    status: "pending", // pending | won | lost
  });
  saveBets(myBets);

  updateBalanceDisplay(true);
  renderBettingHistory();
}

function resolveBets(){
  const pending = myBets.filter(b => b.status === "pending");
  if (pending.length === 0){
    alert("Não há apostas pendentes para resolver. Faça uma aposta primeiro!");
    return;
  }

  const currentLeader = ranking[0]?.name;

  myBets = myBets.map(bet => {
    if (bet.status !== "pending") return bet;
    if (bet.name === currentLeader){
      const payout = Math.round(bet.amount * bet.odds);
      betBalance += payout;
      return { ...bet, status: "won", payout };
    }
    return { ...bet, status: "lost", payout: 0 };
  });

  saveBets(myBets);
  saveBalance(betBalance);
  updateBalanceDisplay(true);
  renderBettingHistory();
}

function updateBalanceDisplay(bump){
  const el = document.getElementById("bet-balance");
  el.textContent = formatNumber(betBalance);
  if (bump){
    el.classList.remove("bump");
    void el.offsetWidth; // força reflow para reiniciar a animação
    el.classList.add("bump");
  }
}

function renderBettingHistory(){
  const list = document.getElementById("betting-history-list");
  if (myBets.length === 0){
    list.innerHTML = `<p class="empty-state">Você ainda não fez nenhuma aposta.</p>`;
    return;
  }

  list.innerHTML = myBets.slice(0, 12).map((bet, i) => {
    let resultHtml = "";
    if (bet.status === "pending") resultHtml = `<span class="history-result pending">Aguardando</span>`;
    else if (bet.status === "won") resultHtml = `<span class="history-result won">+${formatNumber(bet.payout)} 🎉</span>`;
    else resultHtml = `<span class="history-result lost">-${formatNumber(bet.amount)}</span>`;

    return `
      <div class="history-item ${bet.status}" style="animation-delay:${0.03 * i}s">
        <span class="history-main">🎲 ${bet.name} — ${formatNumber(bet.amount)} moedas (${bet.odds}x)</span>
        ${resultHtml}
      </div>
    `;
  }).join("");
}

function initBettingEvents(){
  document.getElementById("simulate-btn").addEventListener("click", resolveBets);
  document.getElementById("reset-balance-btn").addEventListener("click", () => {
    if (!confirm("Reiniciar seu saldo para 1.000 moedas e apagar o histórico de apostas?")) return;
    betBalance = STARTING_BALANCE;
    myBets = [];
    saveBalance(betBalance);
    saveBets(myBets);
    updateBalanceDisplay(true);
    renderBettingHistory();
  });
}

function renderBetting(){
  updateBalanceDisplay(false);
  renderBettingGrid();
  renderBettingHistory();
}

/* --------------------------------------------------------------------------
   9c) MESA DE COMENTARISTAS
   --------------------------------------------------------------------------
   Gera comentários automáticos com base nos dados atuais do ranking:
   liderança, disputas acirradas, zona de eliminação e destaque da semana.
-------------------------------------------------------------------------- */
function generateCommentary(){
  const comments = [];
  const leader = ranking[0];
  const second = ranking[1];
  const last = ranking[ranking.length - 1];

  // Comentário sobre o líder
  comments.push({
    icon: "🎙️",
    author: "Comentarista 1",
    text: `<strong>${leader.name}</strong> dispara na liderança com ${formatNumber(leader.xp)} XP e mantém a ponta da qualificação. Um ritmo impressionante!`,
  });

  // Disputa mais acirrada entre posições consecutivas
  let closestGap = Infinity, closestPair = null;
  for (let i = 0; i < ranking.length - 1; i++){
    const gap = ranking[i].xp - ranking[i + 1].xp;
    if (gap < closestGap){
      closestGap = gap;
      closestPair = [ranking[i], ranking[i + 1]];
    }
  }
  if (closestPair){
    comments.push({
      icon: "🎙️",
      author: "Comentarista 2",
      text: `Fica de olho nessa: <strong>${closestPair[0].name}</strong> e <strong>${closestPair[1].name}</strong> separados por apenas ${formatNumber(closestGap)} XP! A briga pela ${closestPair[0].position}ª posição está acirrada.`,
    });
  }

  // Destaque de quem mais avançou na última semana registrada
  const withLastGain = students.map(s => ({ name: s.name, gain: s.weekly[s.weekly.length - 1] || 0 }));
  const topGainer = withLastGain.reduce((a, b) => (b.gain > a.gain ? b : a));
  if (topGainer.gain > 0){
    comments.push({
      icon: "🎙️",
      author: "Comentarista 1",
      text: `Destaque da última semana: <strong>${topGainer.name}</strong> conquistou ${formatNumber(topGainer.gain)} XP e mostrou evolução real na prática!`,
    });
  }

  // Comentário sobre a zona de eliminação
  const eliminationCandidates = ranking.filter(s => isEliminationZone(s.position));
  if (eliminationCandidates.length > 0){
    const names = eliminationCandidates.map(s => s.name).join(", ");
    comments.push({
      icon: "🎙️",
      author: "Comentarista 2",
      text: `Atenção para a <strong>zona de eliminação</strong>: ${names} precisam reagir com urgência para não ficarem para trás na qualificação.`,
    });
  } else {
    comments.push({
      icon: "🎙️",
      author: "Comentarista 2",
      text: `Ainda não há alunos suficientes para a zona de eliminação entrar em ação — mas ela ativa a partir da ${ELIMINATION_START}ª posição.`,
    });
  }

  return comments;
}

function renderCommentary(){
  const feed = document.getElementById("commentary-feed");
  const comments = generateCommentary();

  feed.innerHTML = comments.map((c, i) => `
    <div class="comment-bubble" style="animation-delay:${0.15 * i}s">
      <div class="comment-avatar">${c.icon}</div>
      <div class="comment-body">
        <span class="comment-author">${c.author}</span>
        <span class="comment-text">${c.text}</span>
      </div>
    </div>
  `).join("");
}

/* --------------------------------------------------------------------------
   10) RENDER: TABELA COMPLETA
-------------------------------------------------------------------------- */
function renderTable(){
  const tbody = document.getElementById("table-body");
  const emptyState = document.getElementById("empty-state-table");
  const list = applyFilters(ranking);

  if (list.length === 0){
    tbody.innerHTML = "";
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  let html = "";
  let dividerShown = false;

  list.forEach((s, i) => {
    const elim = isEliminationZone(s.position);

    if (elim && !dividerShown){
      html += `
        <tr class="table-elimination-row" style="animation-delay:${0.04 * i}s">
          <td colspan="5">
            <div class="elimination-divider">⚠️ Zona de Eliminação</div>
          </td>
        </tr>
      `;
      dividerShown = true;
    }

    html += `
      <tr class="${elim ? "elim-zone-row" : ""}" style="animation-delay:${0.04 * i}s">
        <td class="td-pos">${s.medal ? s.medal + " " : ""}${s.position}º</td>
        <td class="td-name">
          <span class="mini-avatar">${s.initial}</span>
          ${s.name}
        </td>
        <td class="td-xp">${formatNumber(s.xp)}</td>
        <td class="td-points">+${s.points}</td>
        <td>
          <span class="status-badge ${s.status.key}">${s.status.icon} ${s.status.label}</span>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/* --------------------------------------------------------------------------
   11) RENDER: HEADER (estatísticas gerais)
-------------------------------------------------------------------------- */
function renderHeaderStats(){
  const totalXpSum = ranking.reduce((sum, s) => sum + s.xp, 0);
  document.getElementById("stat-students").textContent = ranking.length;
  document.getElementById("stat-total-xp").textContent = formatNumber(totalXpSum);

  const today = new Date();
  document.getElementById("stat-updated").textContent = today.toLocaleDateString("pt-BR");
}

/* --------------------------------------------------------------------------
   12) RENDER GERAL
-------------------------------------------------------------------------- */
function renderAll(){
  renderHeaderStats();
  renderCards();
  renderPodium();
  renderCommentary();
  renderRankingList();
  renderChart();
  renderBetting();
  renderTable();
}

/* --------------------------------------------------------------------------
   13) EVENTOS: busca e filtros
-------------------------------------------------------------------------- */
document.getElementById("search-input").addEventListener("input", (e) => {
  currentSearch = e.target.value;
  renderRankingList();
  renderTable();
});

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderRankingList();
    renderTable();
  });
});

/* --------------------------------------------------------------------------
   14) REVEAL-ON-SCROLL (fluidez ao rolar a página)
-------------------------------------------------------------------------- */
function initScrollReveal(){
  const targets = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  targets.forEach(t => observer.observe(t));
}

/* --------------------------------------------------------------------------
   15) LOADING INICIAL (1 segundo) + INICIALIZAÇÃO
-------------------------------------------------------------------------- */
window.addEventListener("load", () => {
  renderAll();
  initScrollReveal();
  initBettingEvents();

  setTimeout(() => {
    document.getElementById("loading-screen").classList.add("hidden");
  }, 1000);
});
