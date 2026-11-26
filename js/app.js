/**
 * GUIMA GÁS - SIMULADOR DE PLANO DE FORNECIMENTO DE GÁS
 * JavaScript Puro (Vanilla JS)
 * Regras financeiras, geração dinâmica de tabela, formatação em moeda BRL e gráfico em Canvas.
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Constantes e Dados de Referência (Curitiba/PR)
  // ==========================================================================
  const PRECO_MEDIO_BOTIJAO_CURITIBA = 110.00; // Média levantada pela ANP em Curitiba
  const CONSUMO_MEDIO_MENSAL_RESIDENCIAL = 0.85; // ~1 botijão P13 a cada 35-45 dias

  // ==========================================================================
  // 2. Elementos DOM
  // ==========================================================================
  const form = document.getElementById('simulatorForm');
  const inputValorMensal = document.getElementById('valorMensal');
  const inputPeriodo = document.getElementById('periodo');
  const inputTaxaJuros = document.getElementById('taxaJuros');
  const btnLimpar = document.getElementById('btnLimpar');
  const btnExportarCSV = document.getElementById('btnExportarCSV');
  const presetButtons = document.querySelectorAll('.btn-preset');

  // Elementos de Resultados
  const resTotalInvestido = document.getElementById('resTotalInvestido');
  const resTotalJuros = document.getElementById('resTotalJuros');
  const resTotalFinal = document.getElementById('resTotalFinal');
  const resBeneficio = document.getElementById('resBeneficio');
  const resBeneficioSub = document.getElementById('resBeneficioSub');
  const periodoResumoBadge = document.getElementById('periodoResumoBadge');

  // Tabela
  const tabelaCorpo = document.getElementById('tabelaCorpo');
  const tabelaRodape = document.getElementById('tabelaRodape');

  // Canvas Gráfico
  const canvas = document.getElementById('graficoEvolucao');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const chartTooltip = document.getElementById('chartTooltip');

  // Armazenamento do histórico da simulação atual
  let dadosSimulacaoAtual = [];
  let animacaoId = null;

  // ==========================================================================
  // 3. Função de Formatação em Moeda Brasileira (R$)
  // ==========================================================================
  /**
   * Formata número para Moeda Brasileira (Real - BRL).
   * @param {number} valor
   * @returns {string} Ex: "R$ 1.320,00"
   */
  function formatarMoeda(valor) {
    if (isNaN(valor) || valor === null) {
      valor = 0;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  }

  // ==========================================================================
  // 4. Lógica de Cálculo do Plano de Gás
  // ==========================================================================
  /**
   * Obtém a quantidade total de meses a partir dos campos do formulário.
   */
  function obterTotalMeses() {
    const periodo = parseInt(inputPeriodo.value, 10) || 0;
    const unidade = document.querySelector('input[name="unidadePeriodo"]:checked').value;
    return unidade === 'anos' ? periodo * 12 : periodo;
  }

  /**
   * Executa os cálculos financeiros mês a mês e retorna os dados consolidados.
   */
  function calcularPlano() {
    const valorMensal = parseFloat(inputValorMensal.value) || 0;
    const totalMeses = obterTotalMeses();
    const taxaJurosMensal = (parseFloat(inputTaxaJuros.value) || 0) / 100;

    if (valorMensal <= 0 || totalMeses <= 0) {
      return null;
    }

    const meses = [];
    let totalInvestidoAcumulado = 0;
    let saldoAcumulado = 0;
    let totalJurosAcumulado = 0;

    for (let m = 1; m <= totalMeses; m++) {
      // Rendimento gerado sobre o saldo acumulado antes do novo aporte
      const jurosDoMes = saldoAcumulado * taxaJurosMensal;
      totalJurosAcumulado += jurosDoMes;

      // Aporte do mês
      totalInvestidoAcumulado += valorMensal;
      saldoAcumulado = saldoAcumulado + jurosDoMes + valorMensal;

      meses.push({
        mes: m,
        investimentoMes: valorMensal,
        jurosMes: jurosDoMes,
        totalInvestido: totalInvestidoAcumulado,
        totalJurosAcumulado: totalJurosAcumulado,
        saldoFinal: saldoAcumulado
      });
    }

    // Cálculo do Custo-Benefício frente ao mercado de Curitiba
    // Exemplo: Botijão avulso em Curitiba (R$ 110,00). Quantidade equivalente de botijões:
    const botijoesEquivalentes = (totalInvestidoAcumulado / valorMensal) * (valorMensal / PRECO_MEDIO_BOTIJAO_CURITIBA);
    const custoVarejoCuritiba = (totalInvestidoAcumulado / valorMensal) * PRECO_MEDIO_BOTIJAO_CURITIBA;
    
    // O benefício é a soma da valorização dos juros + eventual economia gerada
    const ganhoFinanceiroTotal = totalJurosAcumulado;
    const percentualRetorno = totalInvestidoAcumulado > 0 ? (totalJurosAcumulado / totalInvestidoAcumulado) * 100 : 0;

    return {
      valorMensal,
      totalMeses,
      taxaJurosMensal,
      totalInvestido: totalInvestidoAcumulado,
      totalJuros: totalJurosAcumulado,
      totalFinal: saldoAcumulado,
      ganhoFinanceiroTotal,
      percentualRetorno,
      botijoesEquivalentes,
      meses
    };
  }

  // ==========================================================================
  // 5. Renderização dos Resultados (Totais e Tabela Dinâmica)
  // ==========================================================================
  function atualizarInterface(resultado) {
    if (!resultado) {
      limparResultados();
      return;
    }

    dadosSimulacaoAtual = resultado.meses;

    // Atualiza Totais
    resTotalInvestido.textContent = formatarMoeda(resultado.totalInvestido);
    resTotalJuros.textContent = formatarMoeda(resultado.totalJuros);
    resTotalFinal.textContent = formatarMoeda(resultado.totalFinal);

    // Custo-Benefício
    const percentualFormatado = resultado.percentualRetorno.toFixed(1) + '%';
    resBeneficio.textContent = `+ ${formatarMoeda(resultado.totalJuros)}`;
    resBeneficioSub.textContent = `Retorno de ${percentualFormatado} sobre os aportes`;

    // Badge de período
    const textoUnidade = resultado.totalMeses === 1 ? '1 mês simulado' : `${resultado.totalMeses} meses simulados`;
    periodoResumoBadge.textContent = textoUnidade;

    // Renderiza a Tabela mês a mês dinamicamente
    renderizarTabela(resultado);

    // Atualiza o Gráfico em Canvas
    desenharGrafico(resultado.meses);
  }

  /**
   * Gera o corpo e rodapé da tabela dinamicamente.
   */
  function renderizarTabela(resultado) {
    tabelaCorpo.innerHTML = '';

    resultado.meses.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="col-mes">Mês ${item.mes}</td>
        <td class="col-invest-mes">${formatarMoeda(item.investimentoMes)}</td>
        <td class="col-juros-mes">${formatarMoeda(item.jurosMes)}</td>
        <td class="col-total-invest">${formatarMoeda(item.totalInvestido)}</td>
        <td class="col-saldo-final">${formatarMoeda(item.saldoFinal)}</td>
      `;
      tabelaCorpo.appendChild(tr);
    });

    // Rodapé consolidado
    tabelaRodape.innerHTML = `
      <td><strong>Total</strong></td>
      <td class="col-invest-mes"><strong>-</strong></td>
      <td class="col-juros-mes"><strong>${formatarMoeda(resultado.totalJuros)}</strong></td>
      <td class="col-total-invest"><strong>${formatarMoeda(resultado.totalInvestido)}</strong></td>
      <td class="col-saldo-final"><strong>${formatarMoeda(resultado.totalFinal)}</strong></td>
    `;
  }

  function limparResultados() {
    dadosSimulacaoAtual = [];
    resTotalInvestido.textContent = 'R$ 0,00';
    resTotalJuros.textContent = 'R$ 0,00';
    resTotalFinal.textContent = 'R$ 0,00';
    resBeneficio.textContent = 'R$ 0,00';
    resBeneficioSub.textContent = 'vs. compra avulsa (P13 a R$ 110,00)';
    periodoResumoBadge.textContent = 'Aguardando simulação';
    tabelaCorpo.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 24px; color: #94a3b8;">Nenhuma simulação calculada ainda.</td></tr>';
    tabelaRodape.innerHTML = '';
    limparGrafico();
  }

  // ==========================================================================
  // 6. Gráfico de Linha em Canvas 100% Puro JavaScript
  // ==========================================================================
  function ajustarResolucaoCanvas() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }

  function limparGrafico() {
    if (!ctx) return;
    ajustarResolucaoCanvas();
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Mensagem de estado vazio
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 13px var(--font-main, sans-serif)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Preencha os campos para visualizar o gráfico de evolução.', rect.width / 2, rect.height / 2);
  }

  /**
   * Renderiza o gráfico de linha profissional com eixos, escala e gradientes.
   */
  function desenharGrafico(pontos, indiceHover = -1) {
    if (!ctx || !pontos || pontos.length === 0) {
      limparGrafico();
      return;
    }

    ajustarResolucaoCanvas();
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    // Margens do gráfico
    const paddingLeft = 70;
    const paddingRight = 30;
    const paddingTop = 25;
    const paddingBottom = 40;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    // Determina valor máximo do eixo Y
    const maxSaldo = pontos[pontos.length - 1].saldoFinal;
    const maxVal = maxSaldo > 0 ? maxSaldo * 1.12 : 100;

    // 1. Linhas de Grade e Eixo Y
    const numDivisoes = 4;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px var(--font-main, sans-serif)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= numDivisoes; i++) {
      const yVal = (maxVal / numDivisoes) * i;
      const yPos = height - paddingBottom - (i * (plotHeight / numDivisoes));

      // Linha horizontal
      ctx.beginPath();
      ctx.setLineDash([3, 4]);
      ctx.moveTo(paddingLeft, yPos);
      ctx.lineTo(width - paddingRight, yPos);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label do valor Y em R$
      let labelY = '';
      if (yVal >= 1000) {
        labelY = `R$ ${(yVal / 1000).toFixed(1)}k`;
      } else {
        labelY = `R$ ${Math.round(yVal)}`;
      }
      ctx.fillText(labelY, paddingLeft - 10, yPos);
    }

    // 2. Eixo X e labels de Meses
    const totalPontos = pontos.length;
    const xStep = totalPontos > 1 ? plotWidth / (totalPontos - 1) : 0;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Determina passo de exibição de labels X para não sobrepor
    let passoLabelX = 1;
    if (totalPontos > 36) passoLabelX = 6;
    else if (totalPontos > 18) passoLabelX = 3;
    else if (totalPontos > 10) passoLabelX = 2;

    for (let i = 0; i < totalPontos; i++) {
      const xPos = totalPontos === 1 ? paddingLeft + plotWidth / 2 : paddingLeft + (i * xStep);
      const mesNum = pontos[i].mes;

      if (i === 0 || i === totalPontos - 1 || (mesNum % passoLabelX === 0)) {
        ctx.fillStyle = '#64748b';
        ctx.fillText(`M${mesNum}`, xPos, height - paddingBottom + 10);
      }
    }

    // Função de mapeamento de coordenadas
    function getCoords(item, index, campo) {
      const x = totalPontos === 1 ? paddingLeft + plotWidth / 2 : paddingLeft + (index * xStep);
      const val = item[campo];
      const y = height - paddingBottom - ((val / maxVal) * plotHeight);
      return { x, y };
    }

    // 3. Gradiente e Área de preenchimento do Saldo Final
    if (totalPontos > 1) {
      const gradiente = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
      gradiente.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
      gradiente.addColorStop(1, 'rgba(16, 185, 129, 0.01)');

      ctx.beginPath();
      const firstCoord = getCoords(pontos[0], 0, 'saldoFinal');
      ctx.moveTo(firstCoord.x, firstCoord.y);

      for (let i = 1; i < totalPontos; i++) {
        const c = getCoords(pontos[i], i, 'saldoFinal');
        ctx.lineTo(c.x, c.y);
      }
      ctx.lineTo(paddingLeft + ((totalPontos - 1) * xStep), height - paddingBottom);
      ctx.lineTo(paddingLeft, height - paddingBottom);
      ctx.closePath();
      ctx.fillStyle = gradiente;
      ctx.fill();
    }

    // 4. Linha 1: Total Investido (Azul Céu)
    ctx.beginPath();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < totalPontos; i++) {
      const c = getCoords(pontos[i], i, 'totalInvestido');
      if (i === 0) ctx.moveTo(c.x, c.y);
      else ctx.lineTo(c.x, c.y);
    }
    ctx.stroke();

    // 5. Linha 2: Saldo Final com Juros (Verde Esmeralda)
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    for (let i = 0; i < totalPontos; i++) {
      const c = getCoords(pontos[i], i, 'saldoFinal');
      if (i === 0) ctx.moveTo(c.x, c.y);
      else ctx.lineTo(c.x, c.y);
    }
    ctx.stroke();

    // 6. Pontos / Marcadores (se pontos <= 24 ou para ponto hovered)
    if (totalPontos <= 24) {
      pontos.forEach((item, i) => {
        const cInvest = getCoords(item, i, 'totalInvestido');
        const cFinal = getCoords(item, i, 'saldoFinal');

        // Ponto Investido
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cInvest.x, cInvest.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Ponto Saldo Final
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cFinal.x, cFinal.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }

    // 7. Destaque de Ponto com Mouse Hover
    if (indiceHover >= 0 && indiceHover < totalPontos) {
      const itemHover = pontos[indiceHover];
      const cInvest = getCoords(itemHover, indiceHover, 'totalInvestido');
      const cFinal = getCoords(itemHover, indiceHover, 'saldoFinal');

      // Linha vertical guia
      ctx.beginPath();
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([4, 4]);
      ctx.moveTo(cFinal.x, paddingTop);
      ctx.lineTo(cFinal.x, height - paddingBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ponto Hover Final
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(cFinal.x, cFinal.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ponto Hover Investido
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(cInvest.x, cInvest.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // ==========================================================================
  // 7. Interação de Hover com Tooltip no Gráfico
  // ==========================================================================
  if (canvas && chartTooltip) {
    canvas.addEventListener('mousemove', function (e) {
      if (!dadosSimulacaoAtual || dadosSimulacaoAtual.length === 0) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const paddingLeft = 70;
      const paddingRight = 30;
      const plotWidth = rect.width - paddingLeft - paddingRight;
      const totalPontos = dadosSimulacaoAtual.length;

      if (mouseX < paddingLeft || mouseX > rect.width - paddingRight) {
        chartTooltip.style.display = 'none';
        desenharGrafico(dadosSimulacaoAtual, -1);
        return;
      }

      const xStep = totalPontos > 1 ? plotWidth / (totalPontos - 1) : 0;
      const relativeX = mouseX - paddingLeft;
      let indiceAprox = totalPontos > 1 ? Math.round(relativeX / xStep) : 0;
      indiceAprox = Math.max(0, Math.min(totalPontos - 1, indiceAprox));

      const item = dadosSimulacaoAtual[indiceAprox];
      const pontoX = totalPontos === 1 ? paddingLeft + plotWidth / 2 : paddingLeft + (indiceAprox * xStep);

      // Conteúdo do Tooltip
      chartTooltip.innerHTML = `
        <strong>Mês ${item.mes} de ${totalPontos}</strong>
        <div>Aporte do Mês: ${formatarMoeda(item.investimentoMes)}</div>
        <div>Total Investido: ${formatarMoeda(item.totalInvestido)}</div>
        <div style="color: #6ee7b7; font-weight: 700;">Saldo Acumulado: ${formatarMoeda(item.saldoFinal)}</div>
        <div style="color: #fbbf24;">Juros Acumulados: ${formatarMoeda(item.totalJurosAcumulado)}</div>
      `;

      chartTooltip.style.display = 'block';
      chartTooltip.style.left = `${pontoX}px`;
      chartTooltip.style.top = `${Math.max(40, mouseY - 15)}px`;

      desenharGrafico(dadosSimulacaoAtual, indiceAprox);
    });

    canvas.addEventListener('mouseleave', function () {
      if (chartTooltip) chartTooltip.style.display = 'none';
      if (dadosSimulacaoAtual.length > 0) {
        desenharGrafico(dadosSimulacaoAtual, -1);
      }
    });
  }

  // ==========================================================================
  // 8. Eventos de Formulário (Calcular, Limpar, Presets e Live Update)
  // ==========================================================================
  function executarSimulacao() {
    const resultado = calcularPlano();
    atualizarInterface(resultado);
  }

  // Submissão do formulário
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    executarSimulacao();
    // Rolagem suave até a área de resultados em dispositivos móveis
    if (window.innerWidth < 768) {
      document.getElementById('resultadoContainer').scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Atualização em tempo real conforme digitação (Live update)
  [inputValorMensal, inputPeriodo, inputTaxaJuros].forEach(input => {
    input.addEventListener('input', () => {
      executarSimulacao();
    });
  });

  // Mudança de unidade de tempo (meses / anos)
  document.querySelectorAll('input[name="unidadePeriodo"]').forEach(radio => {
    radio.addEventListener('change', () => {
      executarSimulacao();
    });
  });

  // Botão Limpar
  btnLimpar.addEventListener('click', function () {
    inputValorMensal.value = '';
    inputPeriodo.value = '';
    inputTaxaJuros.value = '0.85';
    document.querySelector('input[name="unidadePeriodo"][value="meses"]').checked = true;
    limparResultados();
    inputValorMensal.focus();
  });

  // Botões de Presets rápidos
  presetButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const valor = this.getAttribute('data-valor');
      const periodo = this.getAttribute('data-periodo');
      const unidade = this.getAttribute('data-unidade');
      const taxa = this.getAttribute('data-taxa');

      inputValorMensal.value = valor;
      inputPeriodo.value = periodo;
      inputTaxaJuros.value = taxa;

      const radio = document.querySelector(`input[name="unidadePeriodo"][value="${unidade}"]`);
      if (radio) radio.checked = true;

      executarSimulacao();
    });
  });

  // Exportar Tabela para CSV
  if (btnExportarCSV) {
    btnExportarCSV.addEventListener('click', function () {
      if (!dadosSimulacaoAtual || dadosSimulacaoAtual.length === 0) {
        alert('Realize uma simulação antes de exportar os dados.');
        return;
      }

      let csv = 'Mês;Investimento do Mês (R$);Juros do Mês (R$);Total Investido (R$);Valor Total Acumulado (R$)\n';
      dadosSimulacaoAtual.forEach(item => {
        csv += `${item.mes};${item.investimentoMes.toFixed(2).replace('.', ',')};${item.jurosMes.toFixed(2).replace('.', ',')};${item.totalInvestido.toFixed(2).replace('.', ',')};${item.saldoFinal.toFixed(2).replace('.', ',')}\n`;
      });

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `guima_gas_simulacao_${dadosSimulacaoAtual.length}_meses.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // Redimensionamento responsivo do gráfico
  window.addEventListener('resize', () => {
    if (dadosSimulacaoAtual.length > 0) {
      desenharGrafico(dadosSimulacaoAtual);
    }
  });

  // Inicialização automática com os valores padrão
  window.addEventListener('DOMContentLoaded', () => {
    executarSimulacao();
  });

})();
