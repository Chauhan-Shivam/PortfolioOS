import React, { useState } from 'react';
import '../styles/calculator.css'; // We will create this next

type Operator = '+' | '-' | '*' | '/';

const Calculator: React.FC = () => {
  const [displayValue, setDisplayValue] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const performCalculation = (): number => {
    const prev = previousValue ?? 0;
    const current = parseFloat(displayValue);
    if (operator === '+') return prev + current;
    if (operator === '-') return prev - current;
    if (operator === '*') return prev * current;
    if (operator === '/') return prev / current;
    return current;
  };

  const handleNumberClick = (num: string) => {
    if (waitingForOperand) {
      setDisplayValue(num);
      setWaitingForOperand(false);
    } else {
      setDisplayValue(displayValue === '0' ? num : displayValue + num);
    }
  };

  const handleDecimalClick = () => {
    if (waitingForOperand) {
      setDisplayValue('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  };

  const handleOperatorClick = (op: Operator) => {
    if (previousValue !== null && operator && !waitingForOperand) {
      const result = performCalculation();
      setDisplayValue(String(result));
      setPreviousValue(result);
    } else {
      setPreviousValue(parseFloat(displayValue));
    }
    setOperator(op);
    setWaitingForOperand(true);
  };

  const handleEqualsClick = () => {
    if (previousValue === null || !operator) return;
    const result = performCalculation();
    setDisplayValue(String(result));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleClearClick = () => {
    setDisplayValue('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleToggleSignClick = () => {
    setDisplayValue(String(parseFloat(displayValue) * -1));
  };

  const handlePercentClick = () => {
    setDisplayValue(String(parseFloat(displayValue) / 100));
  };

  return (
    <div className="calculator">
      <div className="calc-display">{displayValue}</div>
      <div className="calc-keypad">
        <button className="key-function" onClick={handleClearClick}>AC</button>
        <button className="key-function" onClick={handleToggleSignClick}>+/-</button>
        <button className="key-function" onClick={handlePercentClick}>%</button>
        <button className="key-operator" onClick={() => handleOperatorClick('/')}>÷</button>

        <button onClick={() => handleNumberClick('7')}>7</button>
        <button onClick={() => handleNumberClick('8')}>8</button>
        <button onClick={() => handleNumberClick('9')}>9</button>
        <button className="key-operator" onClick={() => handleOperatorClick('*')}>×</button>

        <button onClick={() => handleNumberClick('4')}>4</button>
        <button onClick={() => handleNumberClick('5')}>5</button>
        <button onClick={() => handleNumberClick('6')}>6</button>
        <button className="key-operator" onClick={() => handleOperatorClick('-')}>−</button>

        <button onClick={() => handleNumberClick('1')}>1</button>
        <button onClick={() => handleNumberClick('2')}>2</button>
        <button onClick={() => handleNumberClick('3')}>3</button>
        <button className="key-operator" onClick={() => handleOperatorClick('+')}>+</button>

        <button className="key-zero" onClick={() => handleNumberClick('0')}>0</button>
        <button onClick={handleDecimalClick}>.</button>
        <button className="key-operator" onClick={handleEqualsClick}>=</button>
      </div>
    </div>
  );
};

export default Calculator;