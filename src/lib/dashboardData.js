/**
 * Funções para buscar e calcular dados do dashboard.
 * Usa /promissorias e /clientes; se o backend tiver GET /dashboard ou /dashboard/stats, pode ser trocado depois.
 */

import api from './api';

const PERIODS = {
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

function getValorAReceber(p) {
  if (p.status === 'paga' || p.status === 'cancelada') return 0;
  return toNum(p.saldo_restante ?? p.valor_original_total ?? p.valor);
}

function getValorTotal(p) {
  return toNum(p.valor_original_total ?? p.valor);
}

function getDataPagamento(p) {
  const d = p.data_pagamento ?? p.data_pago ?? p.updated_at;
  if (!d) return null;
  try {
    return new Date(d);
  } catch {
    return null;
  }
}

function isInPeriod(date, periodKey, startCustom, endCustom) {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  if (periodKey === 'personalizado' && startCustom && endCustom) {
    const start = new Date(startCustom);
    const end = new Date(endCustom);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  }

  if (periodKey === 'hoje') {
    return d.toDateString() === now.toDateString();
  }

  const days = PERIODS[periodKey]?.days;
  if (days == null) return true;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return d >= from && d <= now;
}

/**
 * Busca todas as promissórias (paginado se necessário) e total de clientes.
 */
export async function fetchDashboardRaw() {
  const [promRes, clientesRes] = await Promise.all([
    api.get('/promissorias', { params: { per_page: 1000, page: 1 } }),
    api.get('/clientes', { params: { per_page: 1, page: 1 } }),
  ]);

  const promissorias = promRes.data?.data ?? [];
  const totalClientes = clientesRes.data?.meta?.total ?? 0;

  // Se houver mais páginas de promissórias, buscar (dashboard costuma ter até ~2–3 páginas)
  const meta = promRes.data?.meta ?? {};
  const totalProm = meta.total ?? promissorias.length;
  const perPage = meta.per_page ?? 1000;
  const lastPage = meta.last_page ?? 1;

  const allPromissorias = [...promissorias];
  for (let page = 2; page <= lastPage; page++) {
    const { data } = await api.get('/promissorias', { params: { per_page: perPage, page } });
    const list = data?.data ?? [];
    allPromissorias.push(...list);
  }

  return { promissorias: allPromissorias, totalClientes };
}

/**
 * Calcula KPIs e dados para gráficos/tabelas a partir da lista de promissórias e período.
 */
export function computeDashboardData(promissorias, totalClientes, periodKey = '30', customStart, customEnd) {
  const abertas = promissorias.filter((p) => p.status === 'pendente' || p.status === 'vencida');
  const totalAReceber = abertas.reduce((acc, p) => acc + getValorAReceber(p), 0);
  const vencidas = promissorias.filter((p) => p.status === 'vencida');
  const totalVencidas = vencidas.reduce((acc, p) => acc + getValorAReceber(p), 0);
  const pagas = promissorias.filter((p) => p.status === 'paga');
  const pagasNoPeriodo = pagas.filter((p) => isInPeriod(getDataPagamento(p), periodKey, customStart, customEnd));
  const recebimentosNoPeriodo = pagasNoPeriodo.reduce((acc, p) => acc + toNum(p.valor_total_pago ?? getValorTotal(p)), 0);

  // Clientes ativos = quem tem pelo menos uma promissória aberta
  const clientesAtivosSet = new Set(abertas.map((p) => p.cliente_id).filter(Boolean));
  const clientesAtivos = clientesAtivosSet.size;

  // Comparação com período anterior (simplificado: mesmo número de dias antes)
  const prevStart = new Date();
  const prevEnd = new Date();
  const days = PERIODS[periodKey]?.days ?? 30;
  if (periodKey === 'hoje') {
    prevStart.setDate(prevStart.getDate() - 1);
    prevEnd.setDate(prevEnd.getDate() - 1);
  } else {
    prevEnd.setDate(prevEnd.getDate() - days - 1);
    prevStart.setDate(prevStart.getDate() - days * 2);
  }
  const pagasPeriodoAnterior = pagas.filter((p) => {
    const dt = getDataPagamento(p);
    if (!dt) return false;
    return dt >= prevStart && dt <= prevEnd;
  });
  const recebimentosAnterior = pagasPeriodoAnterior.reduce(
    (acc, p) => acc + toNum(p.valor_total_pago ?? getValorTotal(p)),
    0
  );
  const variacaoRecebimentos =
    recebimentosAnterior > 0
      ? ((recebimentosNoPeriodo - recebimentosAnterior) / recebimentosAnterior) * 100
      : recebimentosNoPeriodo > 0
        ? 100
        : 0;

  // Gráfico principal: recebimentos ao longo do tempo (por dia ou por mês conforme período)
  const recebimentosPorData = {};
  pagasNoPeriodo.forEach((p) => {
    const dt = getDataPagamento(p);
    if (!dt) return;
    const key = periodKey === '30' || periodKey === 'personalizado'
      ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
      : dt.toISOString().slice(0, 10);
    const val = toNum(p.valor_total_pago ?? getValorTotal(p));
    recebimentosPorData[key] = (recebimentosPorData[key] || 0) + val;
  });
  const recebimentosSerie = Object.entries(recebimentosPorData)
    .map(([data, valor]) => ({ data, valor }))
    .sort((a, b) => a.data.localeCompare(b.data));

  // Status das promissórias (para pizza/barra)
  const porStatus = {
    pendente: promissorias.filter((p) => p.status === 'pendente').length,
    vencida: promissorias.filter((p) => p.status === 'vencida').length,
    paga: promissorias.filter((p) => p.status === 'paga').length,
    cancelada: promissorias.filter((p) => p.status === 'cancelada').length,
  };

  // Distribuição por cliente (valor a receber por cliente)
  const porCliente = {};
  abertas.forEach((p) => {
    const id = p.cliente_id;
    const nome = p.cliente?.nome ?? `Cliente #${id}`;
    if (!porCliente[id]) porCliente[id] = { cliente_id: id, nome, valor: 0 };
    porCliente[id].valor += getValorAReceber(p);
  });
  const distribuicaoCliente = Object.values(porCliente)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  // Próximos vencimentos (abertas ordenadas por data_vencimento)
  const proximosVencimentos = [...abertas]
    .filter((p) => p.data_vencimento)
    .sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento))
    .slice(0, 10);

  // Maiores dívidas (abertas ordenadas por valor)
  const maioresDividas = [...abertas]
    .sort((a, b) => getValorAReceber(b) - getValorAReceber(a))
    .slice(0, 10);

  // Últimos pagamentos
  const ultimosPagamentos = [...pagas]
    .filter((p) => getDataPagamento(p))
    .sort((a, b) => getDataPagamento(b) - getDataPagamento(a))
    .slice(0, 10);

  return {
    kpis: {
      totalAReceber,
      totalVencidas,
      recebimentosNoPeriodo,
      clientesAtivos: totalClientes > 0 ? clientesAtivos : totalClientes,
      totalClientes,
      variacaoRecebimentos,
    },
    recebimentosSerie,
    porStatus,
    distribuicaoCliente,
    proximosVencimentos,
    maioresDividas,
    ultimosPagamentos,
  };
}

export { PERIODS };
