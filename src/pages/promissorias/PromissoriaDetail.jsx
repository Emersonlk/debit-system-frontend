import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import MarcarComoPagaModal from '../../components/promissorias/MarcarComoPagaModal';
import PagamentoParcialModal from '../../components/promissorias/PagamentoParcialModal';
import CancelarModal from '../../components/promissorias/CancelarModal';

const STATUS_LABELS = { pendente: 'Pendente', paga: 'Paga', vencida: 'Vencida', cancelada: 'Cancelada' };

export default function PromissoriaDetail() {
  const { id } = useParams();
  const [promissoria, setPromissoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marcarPagaOpen, setMarcarPagaOpen] = useState(false);
  const [pagamentoParcialOpen, setPagamentoParcialOpen] = useState(false);
  const [cancelarOpen, setCancelarOpen] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/promissorias/${id}`);
      setPromissoria(data.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Promissória não encontrada.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const onActionSuccess = () => {
    setMarcarPagaOpen(false);
    setPagamentoParcialOpen(false);
    setCancelarOpen(false);
    fetchDetail();
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

  const canMarcarPaga = p => (p?.status === 'pendente' || p?.status === 'vencida');
  const canPagamentoParcial = p => (p?.status === 'pendente' || p?.status === 'vencida');
  const canCancelar = p => (p?.status === 'pendente' || p?.status === 'vencida');

  if (loading) return <p className="text-slate-600">Carregando...</p>;
  if (error || !promissoria) return <div className="rounded-lg bg-red-50 p-4 text-red-700">{error || 'Não encontrado.'}</div>;

  const historico = promissoria.historico_pagamentos ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/promissorias" className="text-sm text-slate-600 hover:underline">← Voltar</Link>
          <h1 className="text-2xl font-semibold text-slate-800">Promissória #{promissoria.id}</h1>
        </div>
        <Link to={`/promissorias/${id}/editar`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Editar</Link>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Cliente</dt>
              <dd className="mt-1 text-slate-800">{promissoria.cliente ? promissoria.cliente.nome : `#${promissoria.cliente_id}`}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Valor</dt>
              <dd className="mt-1 text-slate-800">R$ {formatMoney(promissoria.valor_original_total ?? promissoria.valor)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Vencimento</dt>
              <dd className="mt-1 text-slate-800">{formatDate(promissoria.data_vencimento)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  promissoria.status === 'paga' ? 'bg-green-100 text-green-800' :
                  promissoria.status === 'cancelada' ? 'bg-slate-100 text-slate-700' :
                  promissoria.status === 'vencida' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {STATUS_LABELS[promissoria.status] ?? promissoria.status}
                </span>
              </dd>
            </div>
            {(promissoria.valor_total_pago != null || promissoria.saldo_restante != null) && (
              <>
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-500">Total pago</dt>
                  <dd className="mt-1 text-slate-800">
                    R$ {formatMoney(promissoria.valor_total_pago)}
                    {promissoria.status === 'paga' && (
                      <span className="ml-2 text-sm font-medium text-green-700">(valor integral da promissória)</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-500">Saldo restante</dt>
                  <dd className="mt-1 text-slate-800">R$ {formatMoney(promissoria.saldo_restante)}</dd>
                </div>
              </>
            )}
            {promissoria.observacoes && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase text-slate-500">Observações</dt>
                <dd className="mt-1 text-slate-700 whitespace-pre-wrap">{promissoria.observacoes}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-4">
            {canMarcarPaga(promissoria) && (
              <button type="button" onClick={() => setMarcarPagaOpen(true)} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                Marcar como paga
              </button>
            )}
            {canPagamentoParcial(promissoria) && (
              <button type="button" onClick={() => setPagamentoParcialOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Pagamento parcial
              </button>
            )}
            {canCancelar(promissoria) && (
              <button type="button" onClick={() => setCancelarOpen(true)} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
                Cancelar promissória
              </button>
            )}
          </div>
        </div>

        {historico.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <h2 className="px-6 py-4 text-lg font-semibold text-slate-800 border-b border-slate-200">Histórico de pagamentos</h2>
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {historico.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-3 text-sm text-slate-800">{formatDate(h.data_pagamento)}</td>
                    <td className="px-4 py-3 text-sm text-slate-800">R$ {formatMoney(h.valor_pago)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{h.observacoes ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {marcarPagaOpen && <MarcarComoPagaModal promissoriaId={id} valor={promissoria?.valor} onClose={() => setMarcarPagaOpen(false)} onSuccess={onActionSuccess} />}
      {pagamentoParcialOpen && <PagamentoParcialModal promissoriaId={id} onClose={() => setPagamentoParcialOpen(false)} onSuccess={onActionSuccess} />}
      {cancelarOpen && <CancelarModal promissoriaId={id} onClose={() => setCancelarOpen(false)} onSuccess={onActionSuccess} />}
    </div>
  );
}
