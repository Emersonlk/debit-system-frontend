import { useState } from 'react';
import api from '../../lib/api';
import { maskMoney, unmaskMoney } from '../../lib/masks';

export default function PagamentoParcialModal({ promissoriaId, onClose, onSuccess }) {
  const [valor_pago, setValorPago] = useState('');
  const [data_pagamento, setDataPagamento] = useState(new Date().toISOString().slice(0, 10));
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post(`/promissorias/${promissoriaId}/pagamento-parcial`, {
        valor_pago: unmaskMoney(valor_pago),
        data_pagamento,
        observacoes: observacoes.trim() || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao registrar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Pagamento parcial</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Valor pago *</label>
            <input
              type="text"
              inputMode="numeric"
              value={valor_pago}
              onChange={(e) => setValorPago(maskMoney(e.target.value))}
              required
              placeholder="R$ 0,00"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Data do pagamento *</label>
            <input
              type="date"
              value={data_pagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              maxLength={1000}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
