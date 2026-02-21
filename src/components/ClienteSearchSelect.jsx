import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';

const DEBOUNCE_MS = 300;

export default function ClienteSearchSelect({ value, onChange, placeholder = 'Buscar por nome...', error, disabled }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [loadingCliente, setLoadingCliente] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  const fetchClientes = useCallback(async (search, page = 1) => {
    setLoading(true);
    try {
      const params = { per_page: 15, page };
      if (search && search.trim()) params.search = search.trim();
      const { data } = await api.get('/clientes', { params });
      setOptions(data.data ?? []);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega o cliente selecionado quando value (id) existe
  useEffect(() => {
    if (!value) {
      setSelectedCliente(null);
      setLoadingCliente(false);
      return;
    }
    const id = parseInt(value, 10);
    if (selectedCliente?.id === id) return;
    const found = options.find((c) => c.id === id);
    if (found) {
      setSelectedCliente(found);
      setLoadingCliente(false);
      return;
    }
    setLoadingCliente(true);
    api.get(`/clientes/${id}`)
      .then(({ data }) => {
        setSelectedCliente(data.data);
      })
      .catch(() => {
        setSelectedCliente(null);
      })
      .finally(() => setLoadingCliente(false));
  }, [value]);

  // Debounce da busca ao digitar
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!open) return;
    debounceRef.current = setTimeout(() => {
      fetchClientes(query);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, fetchClientes]);

  // Ao abrir o dropdown, carrega lista inicial se vazia
  useEffect(() => {
    if (open && options.length === 0 && !query.trim()) {
      fetchClientes('');
    }
  }, [open, query, fetchClientes, options.length]);

  // Clique fora fecha o dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (cliente) => {
    setSelectedCliente(cliente);
    onChange(String(cliente.id));
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedCliente(null);
    setQuery('');
    onChange('');
    setOpen(false);
  };

  const inputClass = `w-full rounded-lg border px-3 py-2.5 pr-20 min-h-[44px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
    error ? 'border-red-400' : 'border-slate-300'
  }`;

  return (
    <div ref={containerRef} className="relative">
      {value && !selectedCliente && loadingCliente ? (
        <div className="flex items-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 min-h-[44px] text-sm text-slate-500">
          Carregando...
        </div>
      ) : selectedCliente ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 min-h-[44px]">
          <span className="flex-1 text-slate-800">{selectedCliente.nome}</span>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="min-h-[32px] min-w-[32px] flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-50"
            title="Limpar"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClass}
            autoComplete="off"
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">...</span>
          )}
        </div>
      )}

      {open && !selectedCliente && (
        <ul
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {loading && options.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">Buscando...</li>
          ) : options.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">
              {query.trim() ? 'Nenhum cliente encontrado.' : 'Digite para buscar por nome.'}
            </li>
          ) : (
            options.map((c) => (
              <li
                key={c.id}
                role="option"
                tabIndex={0}
                onClick={() => handleSelect(c)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSelect(c);
                }}
                className="cursor-pointer px-4 py-2 text-sm text-slate-800 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
              >
                {c.nome}
                {c.email && <span className="ml-2 text-slate-500 text-xs">{c.email}</span>}
              </li>
            ))
          )}
        </ul>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
