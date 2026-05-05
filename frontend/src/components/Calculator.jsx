import React, { useState } from 'react';

const Calculator = ({ isOpen, onClose }) => {
  const [expr, setExpr] = useState('');
  const [cur, setCur] = useState('0');
  const [isNew, setIsNew] = useState(true);
  const [oper, setOper] = useState(null);
  const [prev, setPrev] = useState(null);

  const handleNum = (n) => {
    if (isNew) {
      setCur(n);
      setIsNew(false);
    } else {
      setCur(cur === '0' ? n : cur + n);
    }
  };

  const handleDot = () => {
    if (isNew) {
      setCur('0.');
      setIsNew(false);
    } else if (!cur.includes('.')) {
      setCur(cur + '.');
    }
  };

  const handleOp = (op) => {
    setPrev(parseFloat(cur));
    setOper(op);
    setExpr(cur + ' ' + op);
    setIsNew(true);
  };

  const handleEq = () => {
    if (!oper || prev === null) return;
    const c = parseFloat(cur);
    let r;
    if (oper === '+') r = prev + c;
    else if (oper === '−') r = prev - c;
    else if (oper === '×') r = prev * c;
    else if (oper === '÷') r = c === 0 ? 'Xato' : prev / c;

    setExpr(prev + ' ' + oper + ' ' + c + ' =');
    const resultStr = typeof r === 'string' ? r : String(parseFloat(r.toFixed(8)));
    setCur(resultStr);
    setOper(null);
    setPrev(null);
    setIsNew(true);
  };

  const handleAC = () => {
    setCur('0');
    setExpr('');
    setOper(null);
    setPrev(null);
    setIsNew(true);
  };

  const handleSign = () => setCur(String(-parseFloat(cur)));
  const handlePct = () => setCur(String(parseFloat(cur) / 100));

  if (!isOpen) return null;

  return (
    <div className="calc-popup open">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-muted)' }}>KALKULYATOR</div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-muted)' }}
        >
          &times;
        </button>
      </div>
      <div className="calc-display">
        <div className="calc-expr">{expr}</div>
        <div className="calc-result">{cur}</div>
      </div>
      <div className="calc-grid">
        <button className="calc-key func" onClick={handleAC}>AC</button>
        <button className="calc-key func" onClick={handleSign}>+/-</button>
        <button className="calc-key func" onClick={handlePct}>%</button>
        <button className="calc-key op" onClick={() => handleOp('÷')}>÷</button>
        <button className="calc-key num" onClick={() => handleNum('7')}>7</button>
        <button className="calc-key num" onClick={() => handleNum('8')}>8</button>
        <button className="calc-key num" onClick={() => handleNum('9')}>9</button>
        <button className="calc-key op" onClick={() => handleOp('×')}>×</button>
        <button className="calc-key num" onClick={() => handleNum('4')}>4</button>
        <button className="calc-key num" onClick={() => handleNum('5')}>5</button>
        <button className="calc-key num" onClick={() => handleNum('6')}>6</button>
        <button className="calc-key op" onClick={() => handleOp('−')}>−</button>
        <button className="calc-key num" onClick={() => handleNum('1')}>1</button>
        <button className="calc-key num" onClick={() => handleNum('2')}>2</button>
        <button className="calc-key num" onClick={() => handleNum('3')}>3</button>
        <button className="calc-key op" onClick={() => handleOp('+')}>+</button>
        <button className="calc-key num zero" onClick={() => handleNum('0')}>0</button>
        <button className="calc-key num" onClick={handleDot}>.</button>
        <button className="calc-key op" onClick={handleEq}>=</button>
      </div>
    </div>
  );
};

export default Calculator;
