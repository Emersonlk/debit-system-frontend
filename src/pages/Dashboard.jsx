import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-4">Início</h1>
      <p className="text-slate-600 mb-6">
        Bem-vindo. Use o menu acima para acessar Clientes ou Promissórias.
      </p>
      <div className="flex gap-4">
        <Link
          to="/clientes"
          className="rounded-lg bg-white border border-slate-200 px-4 py-3 shadow-sm hover:bg-slate-50 text-slate-800 font-medium"
        >
          Ver clientes
        </Link>
        <Link
          to="/promissorias"
          className="rounded-lg bg-white border border-slate-200 px-4 py-3 shadow-sm hover:bg-slate-50 text-slate-800 font-medium"
        >
          Ver promissórias
        </Link>
      </div>
    </div>
  );
}
