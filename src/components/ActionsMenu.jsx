import { useState, useRef, useEffect } from 'react';

/**
 * Menu de ações que funciona bem em mobile (área de toque adequada).
 * Use para listas em que as ações ficam espremidas em tabela no celular.
 */
export default function ActionsMenu({ label = 'Ações', children, className = '' }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          role="menu"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** Item do menu: link ou botão com área de toque adequada (min 44px altura). */
export function ActionsMenuItem({ as: Component = 'button', className = '', children, ...props }) {
  const base =
    'flex w-full min-h-[44px] items-center px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100';
  return (
    <Component className={`${base} ${className}`} {...props}>
      {children}
    </Component>
  );
}
