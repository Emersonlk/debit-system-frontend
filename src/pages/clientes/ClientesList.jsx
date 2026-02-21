import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { maskPhone } from '../../lib/masks';
import TableSkeleton from '../../components/TableSkeleton';

const DEBOUNCE_MS = 400;

export default function ClientesList() {
  const [clientes, setClientes] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [sortBy, setSortBy] = useState('nome');
  const [sortOrder, setSortOrder] = useState('asc');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const abortRef = useRef(null);

  const fetchClientes = useCallback(async (page = 1) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    setLoading(true);
    setError('');
    try {
      const params = { per_page: 15, page, sort_by: sortBy, sort_order: sortOrder };
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/clientes', { params, signal });
      setClientes(data.data ?? []);
      setMeta(data.meta ?? { current_page: 1, last_page: 1, per_page: 15, total: 0 });
    } catch (err) {
      if (err.code === 'ERR_CANCELED') return;
      setError(err.response?.data?.message ?? 'Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, search]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fetchClientes(1);
  }, [fetchClientes]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    setError('');
    try {
      await api.delete(`/clientes/${id}`);
      setConfirmId(null);
      fetchClientes(meta.current_page);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao excluir cliente.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatCpf = (cpf) => {
    if (!cpf) return '-';
    const n = cpf.replace(/\D/g, '');
    if (n.length !== 11) return cpf;
    return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-800">Clientes</h1>
        <Link
          to="/clientes/novo"
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo cliente
        </Link>
      </div>

      {/* Busca e ordenação */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Botão para expandir/colapsar no mobile */}
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="md:hidden w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <span>Buscar e ordenar</span>
          <svg
            className={`w-5 h-5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Conteúdo dos filtros */}
        <div className={`${filtersOpen ? 'block' : 'hidden'} md:block p-4`}>
          <div className="flex flex-col md:flex-row md:flex-wrap md:items-end gap-4">
            <div className="w-full md:min-w-[220px] md:flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">Buscar por nome</label>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Digite o nome do cliente..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
            <div className="w-full md:w-auto">
              <label className="mb-1 block text-xs font-medium text-slate-500">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full md:w-auto rounded-lg border border-slate-300 px-3 py-2.5 text-sm min-h-[44px]"
              >
                <option value="nome">Nome</option>
                <option value="created_at">Data de cadastro</option>
              </select>
            </div>
            <div className="w-full md:w-auto">
              <label className="mb-1 block text-xs font-medium text-slate-500">Ordem</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full md:w-auto rounded-lg border border-slate-300 px-3 py-2.5 text-sm min-h-[44px]"
              >
                <option value="asc">A → Z / Crescente</option>
                <option value="desc">Z → A / Decrescente</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && clientes.length === 0 ? (
        <TableSkeleton columns={5} rows={10} />
      ) : (
        <>
          {loading && clientes.length > 0 && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
              Atualizando...
            </div>
          )}
          {/* Lista em cards para mobile */}
          <div className={`block md:hidden space-y-3 ${loading && clientes.length > 0 ? 'opacity-75' : ''}`}>
            {clientes.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-500 shadow-sm">
                Nenhum cliente cadastrado.
              </div>
            ) : (
              clientes.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-slate-800">{c.nome}</span>
                    <span className="text-sm text-slate-600">CPF: {formatCpf(c.cpf)}</span>
                    <span className="text-sm text-slate-600">E-mail: {c.email ?? '-'}</span>
                    <span className="text-sm text-slate-600">Tel: {c.telefone ? maskPhone(c.telefone) : '-'}</span>
                  </div>
                  {confirmId === c.id ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-sm text-slate-600">Excluir este cliente?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {deletingId === c.id ? 'Excluindo...' : 'Confirmar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Link
                        to={`/clientes/${c.id}/editar`}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => setConfirmId(c.id)}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600"
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Tabela para desktop */}
          <div className={`hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${loading && clientes.length > 0 ? 'opacity-75' : ''}`}>
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">CPF</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">E-mail</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Telefone</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Nenhum cliente cadastrado.
                    </td>
                  </tr>
                ) : (
                  clientes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-800">{c.nome}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatCpf(c.cpf)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.email ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.telefone ? maskPhone(c.telefone) : '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/clientes/${c.id}/editar`}
                          className="mr-3 text-sm text-blue-600 hover:underline"
                        >
                          Editar
                        </Link>
                        {confirmId === c.id ? (
                          <span className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleDelete(c.id)}
                              disabled={deletingId === c.id}
                              className="text-sm text-red-600 hover:underline disabled:opacity-50"
                            >
                              {deletingId === c.id ? 'Excluindo...' : 'Confirmar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmId(null)}
                              className="text-sm text-slate-600 hover:underline"
                            >
                              Cancelar
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmId(c.id)}
                            className="text-sm text-red-600 hover:underline"
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
                Página {meta.current_page} de {meta.last_page} ({meta.total} clientes)
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={meta.current_page <= 1}
                  onClick={() => fetchClientes(meta.current_page - 1)}
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
                        onClick={() => fetchClientes(item)}
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
                  onClick={() => fetchClientes(meta.current_page + 1)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
