/**
 * Dashboard: usa a rota única GET /dashboard com query params (periodo, data_inicio, data_fim, dias).
 */

import api from './api';

export const PERIODS = {
  hoje: { days: 0, label: 'Hoje' },
  '7': { days: 7, label: '7 dias' },
  '30': { days: 30, label: '30 dias' },
  personalizado: { label: 'Personalizado' },
};

function toNum(v) {
  if (v == null || v === '') return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
}

/**
 * Busca dados do dashboard na rota única.
 * @param {string} periodo - 'hoje' | '7' | '30' | 'personalizado' (padrão '30')
 * @param {string} [dataInicio] - YYYY-MM-DD, obrigatório se periodo === 'personalizado'
 * @param {string} [dataFim] - YYYY-MM-DD, obrigatório se periodo === 'personalizado'
 * @param {number} [dias=3] - dias para "próximos vencimentos"
 * @returns {Promise<object>} - resposta bruta da API (data)
 */
export async function fetchDashboard(periodo = '30', dataInicio = '', dataFim = '', dias = 3) {
  const params = { periodo };
  if (periodo === 'personalizado' && dataInicio && dataFim) {
    params.data_inicio = dataInicio;
    params.data_fim = dataFim;
  }
  if (dias != null) params.dias = dias;

  const { data } = await api.get('/dashboard', { params });
  return data?.data ?? data ?? {};
}

/**
 * Mapeia a resposta da API do dashboard para o formato esperado pelo componente Dashboard.
 * @param {object} apiData - objeto retornado pela API (clientes, promissorias, recebimentos_periodo, etc.)
 * @returns {object} - { kpis, recebimentosSerie, porStatus, distribuicaoCliente, proximosVencimentos, maioresDividas, ultimosPagamentos }
 */
export function mapDashboardResponse(apiData) {
  if (!apiData) return null;

  const clientes = apiData.clientes ?? {};
  const promissorias = apiData.promissorias ?? {};
  const valoresTotais = promissorias.valores_totais ?? {};
  const porStatus = promissorias.por_status ?? {};
  const recebimentosPeriodo = apiData.recebimentos_periodo ?? {};
  const resumoVencimento = apiData.resumo_vencimento ?? {};
  const proximasVencimento = resumoVencimento.proximas_vencimento ?? {};
  const vencidas = resumoVencimento.vencidas ?? {};

  const totalAReceber = toNum(valoresTotais.pendente) + toNum(valoresTotais.vencida);
  const totalVencidas = toNum(valoresTotais.vencida);
  const recebimentosNoPeriodo = toNum(recebimentosPeriodo.valor_total);
  const totalClientes = Number(clientes.total) ?? 0;
  const variacao = recebimentosPeriodo.variacao_percentual != null
    ? Number(recebimentosPeriodo.variacao_percentual)
    : null;

  const serie = (recebimentosPeriodo.serie ?? []).map(({ data: d, valor: v }) => ({
    data: d,
    valor: toNum(v),
  })).sort((a, b) => (a.data || '').localeCompare(b.data || ''));

  const distribuicaoCliente = (apiData.distribuicao_cliente ?? []).map((c) => ({
    cliente_id: c.cliente_id,
    nome: c.nome ?? `Cliente #${c.cliente_id}`,
    valor: toNum(c.valor_a_receber),
  }));

  const proximosVencimentos = proximasVencimento.promissorias ?? [];
  const maioresDividas = Array.isArray(apiData.maiores_dividas)
    ? apiData.maiores_dividas
    : (apiData.maiores_dividas?.promissorias ?? []);
  const ultimosPagamentos = Array.isArray(apiData.ultimos_pagamentos)
    ? apiData.ultimos_pagamentos
    : (apiData.ultimos_pagamentos?.promissorias ?? []);

  return {
    kpis: {
      totalAReceber,
      totalVencidas,
      recebimentosNoPeriodo,
      totalClientes,
      clientesAtivos: totalClientes,
      variacaoRecebimentos: variacao,
    },
    recebimentosSerie: serie.length ? serie : [{ data: '', valor: 0 }],
    porStatus: {
      pendente: Number(porStatus.pendente) ?? 0,
      vencida: Number(porStatus.vencida) ?? 0,
      paga: Number(porStatus.paga) ?? 0,
      cancelada: Number(porStatus.cancelada) ?? 0,
    },
    distribuicaoCliente,
    proximosVencimentos,
    maioresDividas,
    ultimosPagamentos,
  };
}
