import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Option {
  value: string | number;
  label: string;
  subtitle?: string;
}

interface AsyncComboBoxProps {
  label: string;
  fetchOptions: (search: string) => Promise<Option[]>;
  value: string | number | null;
  onChange: (value: string | number | null, option?: Option) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface MenuStyle {
  top?: number;
  left?: number;
  width?: number;
  maxHeight?: number;
}

export const AsyncComboBox: React.FC<AsyncComboBoxProps> = ({
  label,
  fetchOptions,
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<MenuStyle>({});
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const t = setTimeout(() => {
      setLoading(true);
      fetchOptions(input).then(setOptions).finally(() => setLoading(false));
    }, 220);
    debounceRef.current = t;
    return () => clearTimeout(t);
  }, [fetchOptions, input, open]);

  useEffect(() => {
    function handleDocMouse(e: MouseEvent) {
      if (!open) return
      if (!containerRef.current) return
      const target = e.target as Node
      if (!containerRef.current.contains(target) && !menuRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleDocMouse)
    return () => document.removeEventListener('mousedown', handleDocMouse)
  }, [open])

  function computeMenuStyle(rect: DOMRect) {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const spaceBelow = Math.max(0, vh - rect.bottom)
    const spaceAbove = Math.max(0, rect.top)
    const horizontalPadding = 8
    const desiredMax = 320

    // compute width and adjust horizontal overflow
    let left = rect.left
    const width = rect.width || 320
    if (left + width > vw - horizontalPadding) left = Math.max(horizontalPadding, vw - width - horizontalPadding)

    // prefer below if enough space, otherwise open above
    const maxBelow = Math.max(spaceBelow - 16, 80)
    let top: number
    let maxHeight: number
    if (spaceBelow >= Math.min(desiredMax, maxBelow) || spaceBelow >= spaceAbove) {
      top = rect.bottom + 6
      maxHeight = Math.min(desiredMax, Math.max(80, spaceBelow - 16))
    } else {
      // open upwards
      maxHeight = Math.min(desiredMax, Math.max(80, spaceAbove - 16))
      top = rect.top - maxHeight - 6
    }

    return { top, left, width, maxHeight }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth: 220 }}>
      <label>{label}</label>
      <input
        type="text"
        value={options.find(o => o.value === value)?.label || input}
        onChange={e => {
          setInput(e.target.value);
          onChange(null);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setMenuStyle(computeMenuStyle(rect));
          setInput('');
          setOpen(true);
        }}
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setMenuStyle(computeMenuStyle(rect));
          setOpen(true);
        }}
        onFocus={(e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setMenuStyle(computeMenuStyle(rect));
          setOpen(true);
        }}
        placeholder={placeholder}
        disabled={disabled}
        style={{ width: '100%' }}
      />
      {open && (() => {
        const available = menuStyle.maxHeight || Math.min(320, window.innerHeight / 2)
        const itemHeight = 44
        const maxItems = Math.max(3, Math.floor(available / itemHeight))
        const visible = options.slice(0, maxItems)
        const moreCount = Math.max(0, options.length - visible.length)

        return createPortal(
          <>
            <div ref={menuRef} style={{ position: 'fixed', zIndex: 1000, background: '#08111f', color: '#e6f3ff', border: '1px solid rgba(34, 211, 238, 0.28)', boxShadow: '0 18px 42px rgba(0,0,0,0.4)', width: menuStyle.width || '320px', top: menuStyle.top, left: menuStyle.left, overflow: 'visible', borderRadius: 8 }}>
              {loading ? <div style={{ padding: 8 }}>Cargando...</div> : null}
              {visible.map(opt => (
                <div
                  key={opt.value}
                  style={{ padding: 8, cursor: 'pointer', background: value === opt.value ? 'rgba(34, 211, 238, 0.14)' : undefined }}
                  onMouseDown={() => {
                    onChange(opt.value, opt);
                    setInput(opt.label);
                    setOpen(false);
                  }}
                >
                  <div>{opt.label}</div>
                  {opt.subtitle && <div style={{ fontSize: 12, color: '#92a5c7' }}>{opt.subtitle}</div>}
                </div>
              ))}
              {!loading && options.length === 0 && <div style={{ padding: 8, color: '#92a5c7' }}>Sin resultados</div>}
              {moreCount > 0 && (
                <div style={{ padding: 8, cursor: 'pointer', borderTop: '1px solid rgba(148, 163, 184, 0.16)', background: 'rgba(34, 211, 238, 0.1)', fontWeight: 800 }} onMouseDown={() => { setShowModal(true); setOpen(false); }}>
                  Mostrar {moreCount} más...
                </div>
              )}
            </div>

            {showModal && createPortal(
              <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'grid', placeItems: 'center', background: 'rgba(2,6,16,0.76)' }} onMouseDown={() => setShowModal(false)}>
                <div style={{ width: 'min(720px, 96%)', maxHeight: '80vh', overflow: 'auto', background: '#08111f', color: '#e6f3ff', border: '1px solid rgba(34, 211, 238, 0.28)', borderRadius: 8, padding: 12 }} onMouseDown={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong>Seleccionar</strong>
                    <button onClick={() => setShowModal(false)} style={{ border: '1px solid rgba(34, 211, 238, 0.28)', background: 'rgba(34, 211, 238, 0.12)', color: '#e6f3ff', padding: '6px 10px', borderRadius: 6 }}>Cerrar</button>
                  </div>
                  {loading ? <div style={{ padding: 8 }}>Cargando...</div> : options.map(opt => (
                    <div key={opt.value} style={{ padding: 8, borderBottom: '1px solid rgba(148, 163, 184, 0.16)', cursor: 'pointer' }} onClick={() => { onChange(opt.value, opt); setInput(opt.label); setShowModal(false); }}>
                      <div>{opt.label}</div>
                      {opt.subtitle && <div style={{ fontSize: 12, color: '#92a5c7' }}>{opt.subtitle}</div>}
                    </div>
                  ))}
                </div>
              </div>, document.body)
            }
          </>, document.body
        )
      })()}
    </div>
  );
};
