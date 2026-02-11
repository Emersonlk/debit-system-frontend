import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { maskPhone, unmaskPhone } from '../../lib/masks';

const initialEndereco = () => ({
  rua: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  complemento: '',
});

export default function ClienteForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [formFields, setFormFields] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    endereco: initialEndereco(),
    temEndereco: false,
    removerEndereco: false,
  });

  useEffect(() => {
    if (!isEdit) return;
    const fetchCliente = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: response } = await api.get(`/clientes/${id}`);
        const c = response.data;
        if (c.endereco && Object.keys(c.endereco).length) {
          setFormFields((prev) => ({
            ...prev,
            nome: c.nome ?? '',
            cpf: c.cpf ?? '',
            email: c.email ?? '',
            telefone: maskPhone(c.telefone ?? ''),
            temEndereco: true,
            endereco: {
              rua: c.endereco.rua ?? '',
              numero: c.endereco.numero ?? '',
              bairro: c.endereco.bairro ?? '',
              cidade: c.endereco.cidade ?? '',
              estado: c.endereco.estado ?? '',
              complemento: c.endereco.complemento ?? '',
            },
          }));
        } else {
          setFormFields((prev) => ({
            ...prev,
            nome: c.nome ?? '',
            cpf: c.cpf ?? '',
            email: c.email ?? '',
            telefone: maskPhone(c.telefone ?? ''),
            temEndereco: false,
            endereco: initialEndereco(),
          }));
        }
      } catch (err) {
        setError(err.response?.data?.message ?? 'Cliente não encontrado.');
      } finally {
        setLoading(false);
      }
    };
    fetchCliente();
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrors({});
    setSubmitting(true);
    try {
      const payload = {
        nome: formFields.nome.trim(),
        cpf: formFields.cpf.replace(/\D/g, ''),
        email: formFields.email.trim(),
        telefone: unmaskPhone(formFields.telefone).trim() || null,
      };
      if (isEdit) {
        if (formFields.removerEndereco) {
          payload.endereco = null;
        } else if (formFields.temEndereco) {
          const end = formFields.endereco;
          payload.endereco = {
            rua: end.rua.trim() || null,
            numero: end.numero.trim() || null,
            bairro: end.bairro.trim() || null,
            cidade: end.cidade.trim() || null,
            estado: end.estado.trim() || null,
            complemento: end.complemento.trim() || null,
          };
        }
        await api.put(`/clientes/${id}`, payload);
        navigate('/clientes');
      } else {
        if (formFields.temEndereco) {
          const end = formFields.endereco;
          payload.endereco = {
            rua: end.rua.trim() || null,
            numero: end.numero.trim() || null,
            bairro: end.bairro.trim() || null,
            cidade: end.cidade.trim() || null,
            estado: end.estado.trim() || null,
            complemento: end.complemento.trim() || null,
          };
        }
        await api.post('/clientes', payload);
        navigate('/clientes');
      }
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
    `w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
      errors[field] ? 'border-red-400' : 'border-slate-300'
    }`;

  if (loading) {
    return <p className="text-slate-600">Carregando...</p>;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (name === 'telefone') val = maskPhone(value);
    if (name.includes('.')) {
      const [parent, key] = name.split('.');
      setFormFields((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [key]: val },
      }));
    } else {
      setFormFields((prev) => ({ ...prev, [name]: val }));
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/clientes" className="text-sm text-slate-600 hover:underline">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-semibold text-slate-800">
          {isEdit ? 'Editar cliente' : 'Novo cliente'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="nome" className="mb-1 block text-sm font-medium text-slate-700">
            Nome *
          </label>
          <input
            id="nome"
            type="text"
            value={formFields.nome}
            name="nome"
            onChange={handleChange}
            required
            maxLength={255}
            className={inputClass('nome')}
          />
          {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
        </div>
        <div>
          <label htmlFor="cpf" className="mb-1 block text-sm font-medium text-slate-700">
            CPF *
          </label>
          <input
            id="cpf"
            type="text"
            value={formFields.cpf}
            name="cpf"
            onChange={handleChange}
            required
            placeholder="Somente números ou 000.000.000-00"
            className={inputClass('cpf')}
          />
          {errors.cpf && <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>}
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            E-mail *
          </label>
          <input
            id="email"
            type="email"
            value={formFields.email}
            name="email"
            onChange={handleChange}
            required
            className={inputClass('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="telefone" className="mb-1 block text-sm font-medium text-slate-700">
            Telefone
          </label>
          <input
            id="telefone"
            type="text"
            value={formFields.telefone}
            name="telefone"
            onChange={handleChange}
            placeholder="(11) 11111-1111"
            maxLength={16}
            className={inputClass('telefone')}
          />
          {errors.telefone && <p className="mt-1 text-sm text-red-600">{errors.telefone}</p>}
        </div>

        {/* Endereço */}
        {isEdit && formFields.temEndereco && !formFields.removerEndereco && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formFields.removerEndereco}
                name="removerEndereco"
                onChange={handleChange}
              />
              <span className="text-sm text-slate-700">Remover endereço</span>
            </label>
          </div>
        )}

        {!formFields.removerEndereco && (
          <>
            {(!isEdit || !formFields.temEndereco) && (
              <div className="rounded-lg border border-slate-200 p-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formFields.temEndereco}
                    name="temEndereco"
                    onChange={(e) => {
                      setFormFields((prev) => ({ ...prev, temEndereco: e.target.checked, endereco: initialEndereco() }));
                      if (!e.target.checked) setFormFields((prev) => ({ ...prev, endereco: initialEndereco() }));
                    }}
                  />
                  <span className="text-sm text-slate-700">Cadastrar endereço</span>
                </label>
              </div>
            )}
            {formFields.temEndereco && (
              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <h2 className="text-sm font-medium text-slate-700">Endereço</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="rua" className="mb-1 block text-sm text-slate-600">Rua</label>
                    <input
                      id="rua"
                      type="text"
                      value={formFields.endereco.rua}
                      name="endereco.rua"
                      onChange={handleChange}
                      maxLength={255}
                      className={inputClass('endereco.rua')}
                    />
                  </div>
                  <div>
                    <label htmlFor="numero" className="mb-1 block text-sm text-slate-600">Número</label>
                    <input
                      id="numero"
                      type="text"
                      value={formFields.endereco.numero}
                      name="endereco.numero"
                      onChange={handleChange}
                      maxLength={20}
                      className={inputClass('endereco.numero')}
                    />
                  </div>
                  <div>
                    <label htmlFor="bairro" className="mb-1 block text-sm text-slate-600">Bairro</label>
                    <input
                      id="bairro"
                      type="text"
                      value={formFields.endereco.bairro}
                      name="endereco.bairro"
                      onChange={handleChange}
                      maxLength={120}
                      className={inputClass('endereco.bairro')}
                    />
                  </div>
                  <div>
                    <label htmlFor="cidade" className="mb-1 block text-sm text-slate-600">Cidade</label>
                    <input
                      id="cidade"
                      type="text"
                      value={formFields.endereco.cidade}
                      name="endereco.cidade"
                      onChange={handleChange}
                      maxLength={120}
                      className={inputClass('endereco.cidade')}
                    />
                  </div>
                  <div>
                    <label htmlFor="estado" className="mb-1 block text-sm text-slate-600">Estado (UF)</label>
                    <input
                      id="estado"
                      type="text"
                      value={formFields.endereco.estado}
                      name="endereco.estado"
                      onChange={handleChange}
                      maxLength={2}
                      placeholder="SP"
                      className={inputClass('endereco.estado')}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="complemento" className="mb-1 block text-sm text-slate-600">Complemento</label>
                    <input
                      id="complemento"
                      type="text"
                      value={formFields.endereco.complemento}
                      name="endereco.complemento"
                      onChange={handleChange}
                      maxLength={255}
                      className={inputClass('endereco.complemento')}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
          </button>
          <Link
            to="/clientes"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
