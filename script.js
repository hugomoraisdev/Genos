let currentUser = localStorage.getItem("usuarioLogado") || "";

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");

  if (pageId === "dashboard") updateDashboard();
  if (pageId === "ajustes") renderAjustes();
}

function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.classList.toggle("show");
  menu.classList.toggle("hidden");
}

document.querySelectorAll("#menu a").forEach(link => {
  link.addEventListener("click", () => {
    const menu = document.getElementById("menu");
    if (window.innerWidth <= 768) {
      menu.classList.remove("show");
      menu.classList.add("hidden");
    }
  });
});

function voltarDashboard() {
  showPage("dashboard");
}

function getData() {
  return JSON.parse(localStorage.getItem("genosData") || "[]");
}

function saveData(entry) {
  const data = getData();
  data.push(entry);
  localStorage.setItem("genosData", JSON.stringify(data));
}

function sum(data, key) {
  return data.reduce((acc, item) => acc + Number(item[key] || 0), 0);
}

document.getElementById("dataForm").addEventListener("submit", e => {
  e.preventDefault();
  const form = e.target;
  const formData = Object.fromEntries(new FormData(form).entries());

  ["captacoes", "abordagens", "agendamentos", "reunioes", "vendas"].forEach(field => {
    formData[field] = Number(formData[field]) || 0;
  });

  saveData(formData);
  form.reset();
  alert("Dados salvos com sucesso!");
  updateDashboard();
});

let chart;
function updateDashboard() {
  const data = getData();
  const metrics = ["captacoes", "abordagens", "agendamentos", "reunioes", "vendas"];
  
  const sums = metrics.reduce((acc, metric) => {
    acc[metric] = sum(data, metric);
    return acc;
  }, {});

  const convAgendamento = sums.captacoes ? ((sums.agendamentos / sums.captacoes) * 100).toFixed(1) : 0;
  const convReuniao = sums.agendamentos ? ((sums.reunioes / sums.agendamentos) * 100).toFixed(1) : 0;
  const convVenda = sums.reunioes ? ((sums.vendas / sums.reunioes) * 100).toFixed(1) : 0;

  document.getElementById("metrics").innerHTML = `
    <div class="card"><strong>Captações:</strong> ${sums.captacoes}</div>
    <div class="card"><strong>Abordagens:</strong> ${sums.abordagens}</div>
    <div class="card"><strong>Agendamentos:</strong> ${sums.agendamentos}</div>
    <div class="card"><strong>Reuniões:</strong> ${sums.reunioes}</div>
    <div class="card"><strong>Vendas:</strong> ${sums.vendas}</div>
    <div class="card"><strong>Conv. Agendamento:</strong> ${convAgendamento}%</div>
    <div class="card"><strong>Conv. Reunião:</strong> ${convReuniao}%</div>
    <div class="card"><strong>Conv. Venda:</strong> ${convVenda}%</div>
  `;

  const ctx = document.getElementById("conversionChart");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Captações", "Abordagens", "Agendamentos", "Reuniões", "Vendas"],
      datasets: [{
        data: [sums.captacoes, sums.abordagens, sums.agendamentos, sums.reunioes, sums.vendas],
        backgroundColor: ["#ff8a65", "#ff6f00", "#ffa726", "#29b6f6", "#66bb6a"]
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#fff" }, grid: { color: "#333" } },
        y: { ticks: { color: "#fff" }, grid: { color: "#333" } }
      }
    }
  });
}

function renderAjustes() {
  const container = document.getElementById("ajustes-container");
  const data = getData();

  if (data.length === 0) {
    container.innerHTML = "<p>Nenhum lançamento encontrado.</p>";
    return;
  }

  container.innerHTML = "";
  data.forEach((entry, index) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <strong>Data:</strong> ${entry.data}<br>
      <strong>Operador:</strong> ${entry.operador}<br>
      <strong>Captações:</strong> ${entry.captacoes} | 
      <strong>Abordagens:</strong> ${entry.abordagens} | 
      <strong>Agendamentos:</strong> ${entry.agendamentos} | 
      <strong>Reuniões:</strong> ${entry.reunioes} | 
      <strong>Vendas:</strong> ${entry.vendas}
      <br><br>
      <button onclick="editarEntrada(${index})">Editar</button>
      <button onclick="excluirEntrada(${index})">Excluir</button>
    `;
    container.appendChild(div);
  });
}

function editarEntrada(index) {
  const data = getData();
  const entry = data[index];
  const container = document.getElementById("ajustes-container");

  const form = document.createElement("form");
  form.className = "card";
  form.innerHTML = `
    <label>Data: <input name="data" type="date" value="${entry.data}" required /></label>
    <label>Operador: <input name="operador" type="text" value="${entry.operador}" required /></label>
    <label>Captações: <input name="captacoes" type="number" value="${entry.captacoes}" required /></label>
    <label>Abordagens: <input name="abordagens" type="number" value="${entry.abordagens}" required /></label>
    <label>Agendamentos: <input name="agendamentos" type="number" value="${entry.agendamentos}" required /></label>
    <label>Reuniões: <input name="reunioes" type="number" value="${entry.reunioes}" /></label>
    <label>Vendas: <input name="vendas" type="number" value="${entry.vendas}" /></label>
    <button type="submit">Salvar</button>
    <button type="button" onclick="renderAjustes()">Cancelar</button>
  `;

  form.onsubmit = function (e) {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(form).entries());
    ["captacoes", "abordagens", "agendamentos", "reunioes", "vendas"].forEach(f => {
      formData[f] = Number(formData[f]) || 0;
    });
    data[index] = formData;
    localStorage.setItem("genosData", JSON.stringify(data));
    alert("Entrada atualizada!");
    updateDashboard();
    renderAjustes();
  };

  container.innerHTML = "";
  container.appendChild(form);
}

function excluirEntrada(index) {
  if (confirm("Tem certeza que deseja excluir este lançamento?")) {
    const data = getData();
    data.splice(index, 1);
    localStorage.setItem("genosData", JSON.stringify(data));
    alert("Entrada excluída!");
    updateDashboard();
    renderAjustes();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  showPage("dashboard");

  if (["hugo", "gilvan"].includes(currentUser)) {
    document.querySelectorAll(".admin-only").forEach(e => e.classList.add("admin-visible"));
  }
});

function renderRelatorios() {
  const data = getData().map(item => ({
    ...item,
    data: new Date(item.data),
  }));

  const agrupar = (items, getKey) => {
    const mapa = {};
    items.forEach(item => {
      const chave = getKey(item);
      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(item);
    });
    return mapa;
  };

  const gerarResumo = grupo => {
    const resumo = {};
    for (let chave in grupo) {
      const total = { captacoes: 0, abordagens: 0, agendamentos: 0, reunioes: 0, vendas: 0 };
      grupo[chave].forEach(e => {
        total.captacoes += e.captacoes;
        total.abordagens += e.abordagens;
        total.agendamentos += e.agendamentos;
        total.reunioes += e.reunioes;
        total.vendas += e.vendas;
      });
      resumo[chave] = total;
    }
    return resumo;
  };

  const gerarTabela = (resumo, containerId) => {
    const container = document.getElementById(containerId);
    let html = `<table><tr><th>Período</th><th>Captações</th><th>Abordagens</th><th>Agendamentos</th><th>Reuniões</th><th>Vendas</th></tr>`;
    for (let chave in resumo) {
      const r = resumo[chave];
      html += `<tr><td>${chave}</td><td>${r.captacoes}</td><td>${r.abordagens}</td><td>${r.agendamentos}</td><td>${r.reunioes}</td><td>${r.vendas}</td></tr>`;
    }
    html += `</table>`;
    container.innerHTML = html;
  };

  const gerarGrafico = (resumo, canvasId, titulo) => {
    const labels = Object.keys(resumo);
    const dados = Object.values(resumo);
    const datasets = ['captacoes', 'abordagens', 'agendamentos', 'reunioes', 'vendas'].map((chave, i) => ({
      label: chave.charAt(0).toUpperCase() + chave.slice(1),
      data: dados.map(e => e[chave]),
      backgroundColor: `hsl(${i * 60}, 70%, 50%)`
    }));

    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: titulo } },
        scales: { x: { stacked: true }, y: { stacked: true } }
      }
    });
  };

  const diario = agrupar(data, e => e.data.toISOString().split('T')[0]);
  const semanal = agrupar(data, e => {
    const d = new Date(e.data);
    const start = new Date(d.setDate(d.getDate() - d.getDay()));
    return start.toISOString().split('T')[0];
  });
  const mensal = agrupar(data, e => `${e.data.getFullYear()}-${String(e.data.getMonth() + 1).padStart(2, '0')}`);

  const resumoDiario = gerarResumo(diario);
  const resumoSemanal = gerarResumo(semanal);
  const resumoMensal = gerarResumo(mensal);

  gerarTabela(resumoDiario, "relatorio-diario");
  gerarTabela(resumoSemanal, "relatorio-semanal");
  gerarTabela(resumoMensal, "relatorio-mensal");

  gerarGrafico(resumoDiario, "graficoDiario", "Gráfico Diário");
  gerarGrafico(resumoSemanal, "graficoSemanal", "Gráfico Semanal");
  gerarGrafico(resumoMensal, "graficoMensal", "Gráfico Mensal");
}








