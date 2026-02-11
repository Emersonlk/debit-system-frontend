import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import ClienteSearchSelect from '../../components/ClienteSearchSelect';
import MarcarComoPagaModal from '../../components/promissorias/MarcarComoPagaModal';
import PagamentoParcialModal from '../../components/promissorias/PagamentoParcialModal';
import CancelarModal from '../../components/promissorias/CancelarModal';

const STATUS_LABELS = {
  pendente: 'Pendente',
  paga: 'Paga',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
};

export default function PromissoriasList() {
  const { user } = useAuth();
  const canDelete = user?.roles?.includes('admin') ?? false;

  const [promissorias, setPromissorias] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => {
    const status = searchParams.get('status') ?? '';
    return { status, cliente_id: '', vencimento: '', sort_by: 'cliente_nome', sort_order: 'asc' };
  });
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [marcarPagaId, setMarcarPagaId] = useState(null);
  const [pagamentoParcialId, setPagamentoParcialId] = useState(null);
  const [cancelarId, setCancelarId] = useState(null);

  const fetchPromissorias = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { per_page: 15, page, sort_by: filters.sort_by, sort_order: filters.sort_order };
      if (filters.status) params.status = filters.status;
      if (filters.cliente_id) params.cliente_id = filters.cliente_id;
      if (filters.vencimento) {
        params.proximas_vencimento = 1;
        params.dias = parseInt(filters.vencimento, 10);
      }
      const { data } = await api.get('/promissorias', { params });
      setPromissorias(data.data ?? []);
      setMeta(data.meta ?? { current_page: 1, last_page: 1, per_page: 15, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao carregar promissórias.');
    } finally {
      setLoading(false);
    }
  };

  // Sincroniza filtros com a URL ao navegar (ex.: clique no dashboard)
  useEffect(() => {
    const status = searchParams.get('status');
    if (status !== null) {
      setFilters((prev) => ({
        ...prev,
        status: status ?? '',
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPromissorias(1);
  }, [filters.status, filters.cliente_id, filters.vencimento, filters.sort_by, filters.sort_order]);

  const goToPage = (page) => {
    fetchPromissorias(page);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setError('');
    try {
      await api.delete(`/promissorias/${id}`);
      setConfirmDeleteId(null);
      fetchPromissorias(meta.current_page);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao excluir promissória.');
    } finally {
      setDeletingId(null);
    }
  };

  const onActionSuccess = () => {
    setMarcarPagaId(null);
    setPagamentoParcialId(null);
    setCancelarId(null);
    fetchPromissorias(meta.current_page);
  };

  const formatMoney = (v) => {
    if (v == null) return '-';
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return isNaN(n) ? v : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (d) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('pt-BR');
    } catch {
      return d;
    }
  };

  const canMarcarPaga = (p) => (p.status === 'pendente' || p.status === 'vencida');
  const canPagamentoParcial = (p) => (p.status === 'pendente' || p.status === 'vencida');
  const canCancelar = (p) => (p.status === 'pendente' || p.status === 'vencida');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Promissórias</h1>
        <Link
          to="/promissorias/novo"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nova promissória
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">Cliente</label>
          <ClienteSearchSelect
            value={filters.cliente_id}
            onChange={(id) => setFilters((f) => ({ ...f, cliente_id: id }))}
            placeholder="Todos (buscar por nome)"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Vencimento</label>
          <select
            value={filters.vencimento}
            onChange={(e) => setFilters((f) => ({ ...f, vencimento: e.target.value }))}
            className="min-w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="7">Próximos 7 dias</option>
            <option value="15">Próximos 15 dias</option>
            <option value="30">Próximos 30 dias</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Ordenar por</label>
          <select
            value={filters.sort_by}
            onChange={(e) => setFilters((f) => ({ ...f, sort_by: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="cliente_nome">Cliente</option>
            <option value="valor">Valor</option>
            <option value="data_vencimento">Data de vencimento</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Ordem</label>
          <select
            value={filters.sort_order}
            onChange={(e) => setFilters((f) => ({ ...f, sort_order: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="asc">A → Z / Crescente</option>
            <option value="desc">Z → A / Decrescente</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-slate-600">Carregando...</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Vencimento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {promissorias.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Nenhuma promissória encontrada.
                    </td>
                  </tr>
                ) : (
                  promissorias.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-800">
                        {p.cliente ? p.cliente.nome : `#${p.cliente_id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800">R$ {formatMoney(p.valor_original_total ?? p.valor)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(p.data_vencimento)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.status === 'paga' ? 'bg-green-100 text-green-800' :
                          p.status === 'cancelada' ? 'bg-slate-100 text-slate-700' :
                          p.status === 'vencida' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/promissorias/${p.id}`} className="mr-2 text-sm text-blue-600 hover:underline">Ver</Link>
                        <Link to={`/promissorias/${p.id}/editar`} className="mr-2 text-sm text-blue-600 hover:underline">Editar</Link>
                        {canMarcarPaga(p) && (
                          <button type="button" onClick={() => setMarcarPagaId(p.id)} className="mr-2 text-sm text-green-600 hover:underline">
                            Marcar paga
                          </button>
                        )}
                        {canPagamentoParcial(p) && (
                          <button type="button" onClick={() => setPagamentoParcialId(p.id)} className="mr-2 text-sm text-slate-600 hover:underline">
                            Pag. parcial
                          </button>
                        )}
                        {canCancelar(p) && (
                          <button type="button" onClick={() => setCancelarId(p.id)} className="mr-2 text-sm text-amber-600 hover:underline">
                            Cancelar
                          </button>
                        )}
                        {confirmDeleteId === p.id ? (
                          <span className="inline-flex gap-2">
                            <button type="button" onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="text-sm text-red-600 hover:underline disabled:opacity-50">
                              {deletingId === p.id ? 'Excluindo...' : 'Confirmar'}
                            </button>
                            <button type="button" onClick={() => setConfirmDeleteId(null)} className="text-sm text-slate-600 hover:underline">Cancelar</button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => canDelete && setConfirmDeleteId(p.id)}
                            disabled={!canDelete}
                            title={!canDelete ? 'Sem permissão para excluir' : undefined}
                            className="text-sm text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                          >
                            Excluir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta.last_page > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                Página {meta.current_page} de {meta.last_page} ({meta.total} promissórias)
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={meta.current_page <= 1}
                  onClick={() => goToPage(meta.current_page - 1)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50"
                >
                  Anterior
                </button>
                {(() => {
                  const current = meta.current_page;
                  const last = meta.last_page;
                  const delta = 1;
                  const pages = [];
                  for (let i = 1; i <= last; i++) {
                    if (i === 1 || i === last || (i >= current - delta && i <= current + delta)) {
                      pages.push(i);
                    }
                  }
                  const items = [];
                  for (let i = 0; i < pages.length; i++) {
                    if (i > 0 && pages[i] - pages[i - 1] > 1) items.push('ellipsis');
                    items.push(pages[i]);
                  }
                  return items.map((item, i) =>
                    item === 'ellipsis' ? (
                      <span key={`e-${i}`} className="px-2 text-slate-400">…</span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => goToPage(item)}
                        className={`min-w-[2.25rem] rounded-lg border px-2 py-1.5 text-sm ${
                          item === current
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  );
                })()}
                <button
                  type="button"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => goToPage(meta.current_page + 1)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {marcarPagaId && <MarcarComoPagaModal promissoriaId={marcarPagaId} valor={promissorias.find((p) => p.id === marcarPagaId)?.valor} onClose={() => setMarcarPagaId(null)} onSuccess={onActionSuccess} />}
      {pagamentoParcialId && <PagamentoParcialModal promissoriaId={pagamentoParcialId} onClose={() => setPagamentoParcialId(null)} onSuccess={onActionSuccess} />}
      {cancelarId && <CancelarModal promissoriaId={cancelarId} onClose={() => setCancelarId(null)} onSuccess={onActionSuccess} />}
    </div>
  );
}
