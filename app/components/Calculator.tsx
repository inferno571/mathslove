'use client';
import { useState } from 'react';

export default function Calculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [expr, setExpr] = useState('');

  const calc = () => {
    try {
      // eslint-disable-next-line no-eval
      setExpr(String(eval(expr)));
    } catch {
      setExpr('Error');
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)} 
        style={{ position: 'fixed', bottom: 20, left: 20, padding: '12px 24px', background: 'var(--teal)', color: 'white', borderRadius: 24, boxShadow: 'var(--shadow-md)', border: 'none', cursor: 'pointer', fontWeight: 600, zIndex: 100 }}
      >
        Calculator
      </button>
    );
  }

  const buttons = ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'];

  return (
    <div style={{ position: 'fixed', bottom: 20, left: 20, background: 'white', padding: 16, borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', width: 240, zIndex: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <strong>Calculator</strong>
        <button onClick={() => setIsOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
      </div>
      <input 
        value={expr} 
        onChange={(e) => setExpr(e.target.value)}
        style={{ width: '100%', padding: '8px', marginBottom: 12, textAlign: 'right', fontSize: '1.2rem', border: '1px solid #ccc', borderRadius: 4 }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {buttons.map(b => (
          <button 
            key={b} 
            onClick={() => {
              if (b === '=') calc();
              else setExpr(e => e === 'Error' ? b : e + b);
            }}
            style={{ padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600 }}
          >
            {b}
          </button>
        ))}
        <button 
          onClick={() => setExpr('')}
          style={{ gridColumn: 'span 4', padding: 8, background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
