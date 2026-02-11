import { useState } from 'react';
import api from '../../lib/api';

export default function CancelarModal({ promissoriaId, onClose, onSuccess }) {
  const [formFields, setFormFields] = useState({ observacoes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post(`/promissorias/${promissoriaId}/cancelar`, {
        observacoes: formFields.observacoes.trim() || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao cancelar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Cancelar promissória</h3>
        <p className="text-sm text-slate-600 mb-4">A promissória será marcada como cancelada. Opcionalmente informe o motivo.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Observações</label>
            <textarea
              name="observacoes"
              value={formFields.observacoes}
              onChange={handleChange}
              rows={3}
              maxLength={1000}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Voltar
            </button>
            <button type="submit" disabled={loading} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
              {loading ? 'Cancelando...' : 'Cancelar promissória'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
