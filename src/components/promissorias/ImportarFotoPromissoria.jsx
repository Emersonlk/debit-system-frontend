import { useState, useRef } from 'react';
import api from '../../lib/api';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_SIZE_MB = 10;

export default function ImportarFotoPromissoria({
  onImportSuccess,
  onExtractedData,
  disabled,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [extractedData, setExtractedData] = useState(null);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [mode, setMode] = useState(null); // 'importar' | 'selecionar_cliente' | 'nenhum_cliente'
  const fileInputRef = useRef(null);

  const reset = () => {
    setSelectedFile(null);
    setPreview(null);
    setCandidates([]);
    setExtractedData(null);
    setSelectedClienteId('');
    setMode(null);
    setError('');
  };

  const handleFileSelect = (file) => {
    if (!file || !file.type.match(/^image\/(jpeg|png|webp)$/i)) {
      setError('Envie uma imagem JPEG, PNG ou WebP.');
      return;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      setError(`O arquivo deve ter no máximo ${MAX_SIZE_MB}MB.`);
      return;
    }
    setError('');
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setCandidates([]);
    setExtractedData(null);
    setSelectedClienteId('');
    setMode(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleInputChange = (e) => {
    const file = e.target?.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = '';
  };

  const handleImportarDireto = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('imagem', selectedFile);
      const { data } = await api.post('/promissorias/importar-imagem', formData);
      if (data?.success) {
        reset();
        onImportSuccess?.(data);
      }
    } catch (err) {
      const res = err.response?.data;
      if (err.response?.status === 422 && res?.data) {
        const cands = res.data.clientes_candidatos ?? [];
        setExtractedData(res.data.dados_extraidos);
        setCandidates(cands);
        if (cands.length === 0) {
          setMode('nenhum_cliente');
          setError('');
        } else {
          setMode('selecionar_cliente');
          setError('');
          setSelectedClienteId(cands[0]?.id ? String(cands[0].id) : '');
        }
      } else {
        setError(res?.message ?? 'Erro ao importar imagem.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImportarComCliente = async () => {
    if (!selectedFile || !selectedClienteId) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('imagem', selectedFile);
      formData.append('cliente_id', selectedClienteId);
      const { data } = await api.post('/promissorias/importar-imagem', formData);
      if (data?.success) {
        reset();
        onImportSuccess?.(data);
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao importar imagem.');
    } finally {
      setLoading(false);
    }
  };

  const handleExtrairRevisar = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('imagem', selectedFile);
      const { data } = await api.post('/promissorias/extrair-imagem', formData);
      if (data?.success && data?.data) {
        const ext = data.data.dados_extraidos ?? {};
        const cands = data.data.clientes_candidatos ?? [];
        setExtractedData(ext);
        setCandidates(cands);
        onExtractedData?.({
          nome_cliente: ext.nome_cliente,
          data_vencimento: ext.data_vencimento,
          valor: ext.valor,
          cpf: ext.cpf,
          clientes_candidatos: cands,
        });
        reset();
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao extrair dados da imagem.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    if (preview) URL.revokeObjectURL(preview);
    reset();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-slate-700">Importar de foto</h3>

      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 py-8 px-4 transition-colors hover:border-blue-400 hover:bg-slate-50"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleInputChange}
            className="hidden"
            capture="environment"
          />
          <p className="mb-2 text-sm text-slate-600">
            Arraste uma imagem ou clique para escolher
          </p>
          <p className="mb-4 text-xs text-slate-500">
            JPEG, PNG ou WebP — máximo {MAX_SIZE_MB}MB
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Escolher foto
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {preview && (
              <img
                src={preview}
                alt="Prévia"
                className="h-24 w-auto max-w-full rounded-lg border border-slate-200 object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{selectedFile?.name}</p>
              <p className="text-xs text-slate-500">
                {(selectedFile?.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {mode === 'selecionar_cliente' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="mb-3 text-sm font-medium text-amber-800">
                Vários clientes encontrados. Selecione o correto:
              </p>
              <select
                value={selectedClienteId}
                onChange={(e) => setSelectedClienteId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.nome}</option>
                ))}
              </select>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleImportarComCliente}
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Importando...' : 'Importar com cliente selecionado'}
                </button>
                <button type="button" onClick={handleCancelar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {mode === 'nenhum_cliente' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="mb-3 text-sm text-amber-800">
                Nenhum cliente encontrado. Cadastre o cliente antes de salvar ou use o botão abaixo para extrair os dados e preencher o formulário para revisão.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExtrairRevisar}
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Extraindo...' : 'Extrair e revisar'}
                </button>
                <button type="button" onClick={handleCancelar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {!mode && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleImportarDireto}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Importar direto'}
              </button>
              <button
                type="button"
                onClick={handleExtrairRevisar}
                disabled={loading}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Extrair e revisar'}
              </button>
              <button type="button" onClick={handleCancelar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
