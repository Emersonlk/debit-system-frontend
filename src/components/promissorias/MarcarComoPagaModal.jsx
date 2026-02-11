import { useState } from 'react';
import api from '../../lib/api';

const formatMoney = (v) => {
  if (v == null) return '0,00';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function MarcarComoPagaModal({ promissoriaId, valor, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    setSuccess(null);
    try {
      const { data } = await api.post(`/promissorias/${promissoriaId}/marcar-como-paga`);
      const totalPago = data?.data?.valor_total_pago ?? data?.data?.valor_original_total ?? data?.data?.valor ?? valor;
      setSuccess({
        message: 'Promissória marcada como paga.',
        valorTotal: totalPago != null && totalPago !== '' ? formatMoney(totalPago) : null,
      });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao marcar como paga.');
    } finally {
      setLoading(false);
    }
  };

  const valorFormatado = valor != null ? formatMoney(valor) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Marcar como paga</h3>
        {success ? (
          <>
            <p className="text-sm text-slate-700 mb-2">{success.message}</p>
            {success.valorTotal && (
              <p className="text-sm font-medium text-green-700 mb-4 rounded-lg bg-green-50 p-3">
                Total pago: R$ {success.valorTotal} (valor integral da promissória)
              </p>
            )}
            <div className="flex justify-end">
              <button type="button" onClick={onSuccess} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                Fechar
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600 mb-2">Confirma que esta promissória foi paga integralmente?</p>
            {valorFormatado && (
              <p className="text-sm text-slate-700 mb-4 rounded-lg bg-slate-50 p-3">
                O valor total da promissória (R$ {valorFormatado}) será registrado como pago.
              </p>
            )}
            {!valorFormatado && <div className="mb-4" />}
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancelar
              </button>
              <button type="button" onClick={handleConfirm} disabled={loading} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                {loading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
