import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import DashboardSkeleton from '../components/DashboardSkeleton';
import { fetchDashboard, mapDashboardResponse, PERIODS } from '../lib/dashboardData';

const formatMoney = (v) => {
  if (v == null) return 'R$ 0,00';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? 'R$ 0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('pt-BR');
  } catch {
    return d;
  }
};

const STATUS_LABELS = { pendente: 'Pendente', vencida: 'Vencida', paga: 'Paga', cancelada: 'Cancelada' };
const STATUS_COLORS = { pendente: '#f59e0b', vencida: '#ef4444', paga: '#22c55e', cancelada: '#64748b' };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [computed, setComputed] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const apiData = await fetchDashboard(
        period,
        period === 'personalizado' ? customStart : '',
        period === 'personalizado' ? customEnd : '',
        3
      );
      setComputed(mapDashboardResponse(apiData));
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao carregar dados do dashboard.');
      setComputed(null);
    } finally {
      setLoading(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isCustom = period === 'personalizado';
  const chartData = computed?.recebimentosSerie?.length
    ? computed.recebimentosSerie.map(({ data, valor }) => ({
        data: new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        valor,
        full: data,
      }))
    : [{ data: '—', valor: 0 }];

  const pieData = computed
    ? Object.entries(computed.porStatus)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({
          name: STATUS_LABELS[status] ?? status,
          value: count,
          fill: STATUS_COLORS[status],
          status,
        }))
    : [];

  const barClienteData = computed?.distribuicaoCliente?.slice(0, 8).map((c) => ({
    nome: c.nome.length > 18 ? c.nome.slice(0, 18) + '…' : c.nome,
    valor: c.valor,
  })) ?? [];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* 1) Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard Financeiro</h1>
          {user?.name && (
            <p className="mt-0.5 text-sm text-slate-500">Olá, {user.name}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {Object.entries(PERIODS).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriod(key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === key
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {isCustom && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <span className="text-slate-400">até</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          )}
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Atualizar
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {!computed && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Nenhum dado disponível para o período.
        </div>
      )}

      {computed && (
        <>
          {/* 2) Cards KPIs - clicáveis para abrir lista filtrada */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/promissorias"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total a receber</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">
                {formatMoney(computed.kpis.totalAReceber)}
              </p>
              {period !== 'hoje' && computed.kpis.variacaoRecebimentos !== null && (
                <p
                  className={`mt-1 text-sm ${
                    computed.kpis.variacaoRecebimentos >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {computed.kpis.variacaoRecebimentos >= 0 ? '↑' : '↓'}{' '}
                  {Math.abs(computed.kpis.variacaoRecebimentos).toFixed(1)}% vs período anterior
                </p>
              )}
            </Link>
            <Link
              to="/promissorias?status=vencida"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Vencidas</p>
              <p className="mt-1 text-2xl font-bold text-red-700">
                {formatMoney(computed.kpis.totalVencidas)}
              </p>
            </Link>
            <Link
              to="/promissorias?status=paga"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pagas no período</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {formatMoney(computed.kpis.recebimentosNoPeriodo)}
              </p>
            </Link>
            <Link
              to="/clientes"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Clientes ativos</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">
                {computed.kpis.totalClientes}
              </p>
            </Link>
          </section>

          {/* 3) Gráfico principal - Recebimentos */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Recebimentos no período</h2>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="data" tick={{ fontSize: 12 }} stroke="#64748b" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                    tickFormatter={(v) => (v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`)}
                  />
                  <Tooltip
                    formatter={(value) => [formatMoney(value), 'Recebido']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.full && formatDate(payload[0].payload.full)}
                  />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorValor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* 4) Gráficos secundários */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Status das promissórias</h2>
              {pieData.length > 0 ? (
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Pie
                        data={pieData}
                        cx="40%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        onClick={(data) => data?.status && navigate(`/promissorias?status=${data.status}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        wrapperStyle={{ fontSize: '12px' }}
                        content={({ payload }) => (
                          <ul className="m-0 list-none p-0">
                            {payload?.map((entry, i) => {
                              const status = entry.payload?.status;
                              const to = status ? `/promissorias?status=${status}` : '/promissorias';
                              return (
                                <li key={i} className="mb-1">
                                  <Link
                                    to={to}
                                    className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 hover:underline"
                                  >
                                    <span
                                      className="inline-block h-3 w-3 shrink-0 rounded-full"
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    {entry.value}: {entry.payload?.value ?? ''}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      />
                      <Tooltip formatter={(value) => [value, 'Quantidade']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-8 text-center text-slate-500">Nenhuma promissória para exibir.</p>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Distribuição por cliente (a receber)</h2>
              {barClienteData.length > 0 ? (
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barClienteData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="nome" width={75} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => [formatMoney(value), 'A receber']} />
                      <Bar dataKey="valor" fill="#6366f1" radius={[0, 4, 4, 0]} name="A receber" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-8 text-center text-slate-500">Nenhum valor a receber por cliente.</p>
              )}
            </div>
          </section>

          {/* 5) Tabelas informativas */}
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="font-semibold text-slate-800">Próximos vencimentos</h2>
              </div>
              <div className="max-h-[280px] overflow-auto">
                {computed.proximosVencimentos.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">Nenhuma promissória aberta.</p>
                ) : (
                  <table className="min-w-full">
                    <tbody className="divide-y divide-slate-100">
                      {computed.proximosVencimentos.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 text-sm text-slate-800">
                            <Link to={`/promissorias/${p.id}`} className="hover:underline">
                              {typeof p.cliente === 'object' ? p.cliente?.nome : p.cliente ?? `#${p.cliente_id}`}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-slate-800">
                            {formatMoney(p.saldo_restante ?? p.valor_original_total ?? p.valor)}
                          </td>
                          <td className="px-4 py-2 text-right text-xs text-slate-500">
                            {formatDate(p.data_vencimento)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="border-t border-slate-200 px-4 py-2 text-right">
                <Link to="/promissorias" className="text-sm font-medium text-blue-600 hover:underline">
                  Ver todas →
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="font-semibold text-slate-800">Maiores dívidas</h2>
              </div>
              <div className="max-h-[280px] overflow-auto">
                {computed.maioresDividas.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">Nenhuma dívida aberta.</p>
                ) : (
                  <table className="min-w-full">
                    <tbody className="divide-y divide-slate-100">
                      {computed.maioresDividas.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 text-sm text-slate-800">
                            <Link to={`/promissorias/${p.id}`} className="hover:underline">
                              {typeof p.cliente === 'object' ? p.cliente?.nome : p.cliente ?? `#${p.cliente_id}`}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-red-700">
                            {formatMoney(p.saldo_restante ?? p.valor_original_total ?? p.valor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="border-t border-slate-200 px-4 py-2 text-right">
                <Link to="/promissorias" className="text-sm font-medium text-blue-600 hover:underline">
                  Ver todas →
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="font-semibold text-slate-800">Últimos pagamentos</h2>
              </div>
              <div className="max-h-[280px] overflow-auto">
                {computed.ultimosPagamentos.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">Nenhum pagamento registrado.</p>
                ) : (
                  <table className="min-w-full">
                    <tbody className="divide-y divide-slate-100">
                      {computed.ultimosPagamentos.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 text-sm text-slate-800">
                            <Link to={`/promissorias/${p.id}`} className="hover:underline">
                              {typeof p.cliente === 'object' ? p.cliente?.nome : p.cliente ?? `#${p.cliente_id}`}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-emerald-700">
                            {formatMoney(p.valor_total_pago ?? p.valor_original_total ?? p.valor)}
                          </td>
                          <td className="px-4 py-2 text-right text-xs text-slate-500">
                            {formatDate(p.data_pagamento ?? p.data_pago ?? p.updated_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="border-t border-slate-200 px-4 py-2 text-right">
                <Link to="/promissorias" className="text-sm font-medium text-blue-600 hover:underline">
                  Ver todas →
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Links rápidos (opcional) */}
      <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-4">
        <Link
          to="/clientes"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Ver clientes
        </Link>
        <Link
          to="/promissorias"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ver promissórias
        </Link>
      </div>
    </div>
  );
}
