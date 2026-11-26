# Simulador de Plano de Fornecimento de Gás - Guima Gás (Curitiba/PR)

Simulador financeiro e operacional para contratação de planos programados de fornecimento de gás GLP (botijões P13 e cilindros), com rendimento financeiro sobre o saldo provisionado e proteção contra a inflação de combustíveis na capital paranaense.

🌐 **Acesse online via GitHub Pages:**  
[https://marcelo92me-netizen.github.io/simulador-plano-gas/](https://marcelo92me-netizen.github.io/simulador-plano-gas/)

---

## 🎯 Objetivo
Permitir que famílias, condomínios e estabelecimentos comerciais de Curitiba simulem o plano mensal de fornecimento programado de gás, visualizando o montante total investido, o total de juros auferidos e o saldo final acumulado, além de comparar com a compra avulsa no mercado local.

## 📊 Dados de Mercado (Curitiba / PR)
* **Preço Médio do Botijão P13 (ANP):** R$ 110,00 (faixa de R$ 97,00 a R$ 120,00 com frete).
* **Consumo Médio Residencial:** 1 botijão a cada 35 a 45 dias para famílias de 3 a 4 pessoas (~0,75 a 1 botijão/mês).
* **Metodologia do Plano:** O valor mensal é calculado com base no consumo programado com desconto contratual de fidelidade (10% a 15% abaixo do varejo), mais aporte de reserva remunerada.
* **Custo-Benefício:** Mensurado pela soma da economia no insumo mais a valorização por juros compostos sobre o saldo acumulado.

---

## 🚀 Funcionalidades
* **Entradas Personalizáveis:**
  * Valor mensal do plano (R$);
  * Período numérico com seleção de unidade (**Meses** ou **Anos**);
  * Rendimento do plano (% a.m.) para projeção de juros compostos.
* **Totais Consolidados:**
  * Valor Total Investido;
  * Total de Juros gerados;
  * Valor Total Final acumulado;
  * Indicador de custo-benefício e retorno sobre o investimento.
* **Tabela Dinâmica Mês a Mês:**
  * Mês;
  * Investimento do mês;
  * Juros do mês;
  * Total investido;
  * Valor Total Acumulado.
  * Exportação dos dados para planilha em formato **CSV**.
* **Gráfico de Linha Interativo:**
  * Desenvolvido em **HTML5 Canvas puro** (sem dependências externas);
  * Comparativo visual entre *Total Investido* e *Saldo Final com Juros*;
  * Suporte a telas de alta resolução (Retina / DPR);
  * Tooltip flutuante com dados detalhados ao passar o mouse.
* **Interface & Usabilidade:**
  * Layout clean, moderno e responsivo;
  * Logomarca estilizada em SVG da **Guima Gás**;
  * Tooltips explicativos em todos os campos;
  * Presets com 1 clique (Residencial, Médio Porte e Comercial);
  * Atualização dos cálculos em tempo real (*live update*).

---

## 🛠️ Tecnologias Utilizadas
* **HTML5** (Semântico e acessível)
* **CSS3** (Variáveis, Flexbox, CSS Grid, responsividade)
* **JavaScript Puro** (Vanilla JS, Canvas API, Intl.NumberFormat)
