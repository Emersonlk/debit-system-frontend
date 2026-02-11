import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { maskPhone } from '../../lib/masks';

export default function ClientesList() {
  const [clientes, setClientes] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const fetchClientes = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/clientes', { params: { per_page: 15, page } });
      setClientes(data.data ?? []);
      setMeta(data.meta ?? { current_page: 1, last_page: 1, per_page: 15, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Clientes</h1>
        <Link
          to="/clientes/novo"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo cliente
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-600">Carregando...</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Página {meta.current_page} de {meta.last_page} ({meta.total} clientes)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={meta.current_page <= 1}
                  onClick={() => fetchClientes(meta.current_page - 1)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-slate-50"
                >
                  Anterior
                </button>
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
