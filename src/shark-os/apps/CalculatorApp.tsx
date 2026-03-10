
import React, { useState } from 'react';

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);
    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (operator) {
      const currentValue = prevValue || 0;
      const newValue = calculate(currentValue, inputValue, operator);
      setPrevValue(newValue);
      setDisplay(String(newValue));
    }
    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (a: number, b: number, op: string) => {
    switch(op) {
      case '/': return a / b;
      case '*': return a * b;
      case '-': return a - b;
      case '+': return a + b;
      default: return b;
    }
  };

  const reset = () => { setDisplay('0'); setPrevValue(null); setOperator(null); setWaitingForOperand(false); };
  const toggleSign = () => { setDisplay(String(parseFloat(display) * -1)); };
  const percent = () => { setDisplay(String(parseFloat(display) / 100)); };

  const btnClass = "h-14 w-14 rounded-full font-bold text-xl flex items-center justify-center active:scale-95 transition-transform select-none";
  const grayBtn = `${btnClass} bg-gray-400 text-black`;
  const orangeBtn = `${btnClass} bg-orange-500 text-white`;
  const darkBtn = `${btnClass} bg-gray-800 text-white`;
  const zeroBtn = "h-14 w-[7.5rem] rounded-full font-bold text-xl flex items-center pl-6 bg-gray-800 text-white active:scale-95 transition-transform select-none";

  return (
    <div className="h-full bg-black text-white flex flex-col p-4 font-sans">
      <div className="flex-1 flex items-end justify-end p-4">
        <span className="text-6xl font-light tracking-tight truncate">{display}</span>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <button className={grayBtn} onClick={reset}>{display === '0' ? 'AC' : 'C'}</button>
        <button className={grayBtn} onClick={toggleSign}>±</button>
        <button className={grayBtn} onClick={percent}>%</button>
        <button className={orangeBtn} onClick={() => performOperation('/')}>÷</button>
        {[7, 8, 9].map(n => <button key={n} className={darkBtn} onClick={() => inputDigit(String(n))}>{n}</button>)}
        <button className={orangeBtn} onClick={() => performOperation('*')}>×</button>
        {[4, 5, 6].map(n => <button key={n} className={darkBtn} onClick={() => inputDigit(String(n))}>{n}</button>)}
        <button className={orangeBtn} onClick={() => performOperation('-')}>−</button>
        {[1, 2, 3].map(n => <button key={n} className={darkBtn} onClick={() => inputDigit(String(n))}>{n}</button>)}
        <button className={orangeBtn} onClick={() => performOperation('+')}>+</button>
        <button className={zeroBtn} onClick={() => inputDigit('0')}>0</button>
        <button className={darkBtn} onClick={() => inputDigit('.')}>.</button>
        <button className={orangeBtn} onClick={() => performOperation('=')}>=</button>
      </div>
    </div>
  );
};
