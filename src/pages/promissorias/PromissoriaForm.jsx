import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import ClienteSearchSelect from '../../components/ClienteSearchSelect';
import ImportarFotoPromissoria from '../../components/promissorias/ImportarFotoPromissoria';
import { maskMoney, unmaskMoney, moneyToInput } from '../../lib/masks';

export default function PromissoriaForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [formFields, setFormFields] = useState({
    cliente_id: '',
    valor: '',
    data_vencimento: '',
    observacoes: '',
  });

  useEffect(() => {
    if (!isEdit) return;
    const fetchPromissoria = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: response } = await api.get(`/promissorias/${id}`);
        const p = response.data;
        setFormFields({
          cliente_id: String(p.cliente_id ?? ''),
          valor: p.valor != null ? maskMoney(moneyToInput(p.valor)) : '',
          data_vencimento: p.data_vencimento ? p.data_vencimento.slice(0, 10) : '',
          observacoes: p.observacoes ?? '',
        });
      } catch (err) {
        setError(err.response?.data?.message ?? 'Promissória não encontrada.');
      } finally {
        setLoading(false);
      }
    };
    fetchPromissoria();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = name === 'valor' ? maskMoney(value) : value;
    setFormFields((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrors({});
    setSubmitting(true);
    try {
      const payload = {
        cliente_id: parseInt(formFields.cliente_id, 10),
        valor: unmaskMoney(formFields.valor),
        data_vencimento: formFields.data_vencimento,
        observacoes: formFields.observacoes.trim() || null,
      };
      if (isEdit) {
        await api.put(`/promissorias/${id}`, payload);
      } else {
        await api.post('/promissorias', payload);
      }
      navigate('/promissorias');
    } catch (err) {
      const res = err.response?.data;
      setError(res?.message ?? 'Erro ao salvar.');
      if (res?.errors && typeof res.errors === 'object') {
        const flat = {};
        Object.keys(res.errors).forEach((k) => {
          flat[k] = Array.isArray(res.errors[k]) ? res.errors[k][0] : res.errors[k];
        });
        setErrors(flat);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${errors[field] ? 'border-red-400' : 'border-slate-300'}`;

  if (loading) {
    return <p className="text-slate-600">Carregando...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/promissorias" className="text-sm text-slate-600 hover:underline">← Voltar</Link>
        <h1 className="text-2xl font-semibold text-slate-800">{isEdit ? 'Editar promissória' : 'Nova promissória'}</h1>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!isEdit && (
        <div className="mb-6 max-w-2xl">
          <ImportarFotoPromissoria
            onImportSuccess={() => navigate('/promissorias')}
            onExtractedData={(dados) => {
              const valorStr = dados.valor != null ? maskMoney(moneyToInput(dados.valor)) : '';
              const dataVenc = dados.data_vencimento ? String(dados.data_vencimento).slice(0, 10) : '';
              const cands = dados.clientes_candidatos ?? [];
              const clienteId = cands.length === 1 ? String(cands[0].id) : cands.length > 0 ? String(cands[0].id) : '';
              setFormFields((prev) => ({
                ...prev,
                cliente_id: clienteId,
                valor: valorStr,
                data_vencimento: dataVenc,
                observacoes: prev.observacoes || (dados.nome_cliente ? `Importado de imagem - Cliente: ${dados.nome_cliente}` : ''),
              }));
            }}
            disabled={submitting}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="cliente_search" className="mb-1 block text-sm font-medium text-slate-700">Cliente *</label>
          <ClienteSearchSelect
            value={formFields.cliente_id}
            onChange={(v) => setFormFields((prev) => ({ ...prev, cliente_id: v }))}
            placeholder="Digite o nome do cliente para buscar..."
            error={errors.cliente_id}
          />
        </div>
        <div>
          <label htmlFor="valor" className="mb-1 block text-sm font-medium text-slate-700">Valor (R$) *</label>
          <input
            id="valor"
            name="valor"
            type="text"
            inputMode="numeric"
            value={formFields.valor}
            onChange={handleChange}
            required
            placeholder="R$ 0,00"
            className={inputClass('valor')}
          />
          {errors.valor && <p className="mt-1 text-sm text-red-600">{errors.valor}</p>}
        </div>
        <div>
          <label htmlFor="data_vencimento" className="mb-1 block text-sm font-medium text-slate-700">Data de vencimento *</label>
          <input
            id="data_vencimento"
            name="data_vencimento"
            type="date"
            value={formFields.data_vencimento}
            onChange={handleChange}
            required
            min={isEdit ? undefined : new Date().toISOString().slice(0, 10)}
            className={inputClass('data_vencimento')}
          />
          {errors.data_vencimento && <p className="mt-1 text-sm text-red-600">{errors.data_vencimento}</p>}
        </div>
        <div>
          <label htmlFor="observacoes" className="mb-1 block text-sm font-medium text-slate-700">Observações</label>
          <textarea
            id="observacoes"
            name="observacoes"
            value={formFields.observacoes}
            onChange={handleChange}
            rows={3}
            maxLength={1000}
            className={inputClass('observacoes')}
          />
          {errors.observacoes && <p className="mt-1 text-sm text-red-600">{errors.observacoes}</p>}
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
          </button>
          <Link to="/promissorias" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
