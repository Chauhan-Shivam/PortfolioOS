import React, { useState } from "react";
import "../styles/calculator.css"; // Ensure this CSS is updated too

type Operator = "+" | "-" | "*" | "/";

const Calculator: React.FC = () => {
  const [displayValue, setDisplayValue] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  // Basic memory state (can be expanded later)
  const [memoryValue, setMemoryValue] = useState<number>(0);

  // --- Calculation Logic ---
  const performCalculation = (): number => {
    const prev = previousValue ?? 0;
    const current = parseFloat(displayValue);
    if (isNaN(prev) || isNaN(current)) return NaN; // Handle potential errors

    switch (operator) {
      case "+":
        return prev + current;
      case "-":
        return prev - current;
      case "*":
        return prev * current;
      case "/":
        if (current === 0) return NaN; // Division by zero
        return prev / current;
      default:
        return current;
    }
  };

  // --- Button Handlers ---
  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplayValue(digit);
      setWaitingForOperand(false);
    } else {
      setDisplayValue(displayValue === "0" ? digit : displayValue + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplayValue("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!displayValue.includes(".")) {
      setDisplayValue(displayValue + ".");
    }
  };

  const handleOperator = (nextOperator: Operator) => {
    const inputValue = parseFloat(displayValue);

    if (previousValue !== null && operator && !waitingForOperand) {
      const result = performCalculation();
      if (isNaN(result)) {
        setDisplayValue("Error");
        // Optionally reset state here
        return;
      }
      setDisplayValue(String(result));
      setPreviousValue(result);
    } else {
      setPreviousValue(inputValue);
    }

    setOperator(nextOperator);
    setWaitingForOperand(true);
  };

  const handleEquals = () => {
    if (previousValue === null || !operator) return;

    const result = performCalculation();
    if (isNaN(result)) {
      setDisplayValue("Error");
      // Optionally reset state here
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(false);
      return;
    }

    setDisplayValue(String(result));
    setPreviousValue(null); // Calculation complete
    setOperator(null);
    setWaitingForOperand(false);
  };

  const clearAll = () => {
    // 'C' button
    setDisplayValue("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const clearEntry = () => {
    // 'CE' button
    setDisplayValue("0");
    setWaitingForOperand(false); // Allow new input immediately
  };

  const backspace = () => {
    if (waitingForOperand) return; // Don't backspace operator placeholder
    setDisplayValue(displayValue.length > 1 ? displayValue.slice(0, -1) : "0");
  };

  const toggleSign = () => {
    setDisplayValue(String(parseFloat(displayValue) * -1));
  };

  const percent = () => {
    // Windows % behavior: (previous * current / 100) if operator exists
    if (previousValue !== null && operator) {
      const currentPercent = (previousValue * parseFloat(displayValue)) / 100;
      setDisplayValue(String(currentPercent));
      // Note: Doesn't complete the operation like equals
    } else {
      // If no operation pending, just show 0
      setDisplayValue("0");
    }
  };

  const squareRoot = () => {
    const value = parseFloat(displayValue);
    if (value < 0) {
      setDisplayValue("Error");
      return;
    }
    setDisplayValue(String(Math.sqrt(value)));
    setWaitingForOperand(false); // Result can be used immediately
  };

  const reciprocal = () => {
    const value = parseFloat(displayValue);
    if (value === 0) {
      setDisplayValue("Error"); // Division by zero
      return;
    }
    setDisplayValue(String(1 / value));
    setWaitingForOperand(false);
  };

  // --- Memory Functions (Basic Implementation) ---
  const memoryClear = () => setMemoryValue(0);
  const memoryRecall = () => {
    setDisplayValue(String(memoryValue));
    setWaitingForOperand(false); // Recalled value is ready
  };
  const memoryStore = () => setMemoryValue(parseFloat(displayValue));
  const memoryAdd = () =>
    setMemoryValue(memoryValue + parseFloat(displayValue));
  const memorySubtract = () =>
    setMemoryValue(memoryValue - parseFloat(displayValue));

return (
    <div className="calculator">
      {/* Optional: Non-functional Menu Bar */}
      <div className="calc-menu-bar">
        <span>Mode</span>
        <span>Edit</span>
        <span>Options</span>
        <span>Help</span>
      </div>

      <div className="calc-display">{displayValue}</div>
      <div className="calc-keypad">
        {/* Row 1: Memory & Clear */}
        <button onClick={memoryClear}>MC</button>
        <button onClick={memoryRecall}>MR</button>
        <button onClick={memoryStore}>MS</button>
        <button onClick={memoryAdd}>M+</button>
        <button onClick={memorySubtract}>M-</button>

        {/* Row 2: Basic Ops */}
        <button onClick={backspace}>←</button>
        <button onClick={clearEntry}>CE</button>
        <button onClick={clearAll}>C</button>
        <button onClick={toggleSign}>±</button>
        <button onClick={squareRoot}>√</button>

        {/* Row 3: Numbers & Ops */}
        <button onClick={() => inputDigit('7')}>7</button>
        <button onClick={() => inputDigit('8')}>8</button>
        <button onClick={() => inputDigit('9')}>9</button>
        <button className="key-operator" onClick={() => handleOperator('/')}>/</button>
        <button onClick={percent}>%</button>

        {/* Row 4: Numbers & Ops */}
        <button onClick={() => inputDigit('4')}>4</button>
        <button onClick={() => inputDigit('5')}>5</button>
        <button onClick={() => inputDigit('6')}>6</button>
        <button className="key-operator" onClick={() => handleOperator('*')}>*</button>
        <button onClick={reciprocal}>1/x</button>

        {/* Row 5: Numbers, Op, Equals */}
        <button onClick={() => inputDigit('1')}>1</button>
        <button onClick={() => inputDigit('2')}>2</button>
        <button onClick={() => inputDigit('3')}>3</button>
        <button className="key-operator" onClick={() => handleOperator('-')}>-</button>
        <button className="key-equals" onClick={handleEquals}>=</button>

        {/* Row 6: Zero, Decimal, Op */}
        <button className="key-zero" onClick={() => inputDigit('0')}>0</button>
        <button onClick={inputDecimal}>.</button>
        <button className="key-operator" onClick={() => handleOperator('+')}>+</button>
      </div>
    </div>
  );
};

export default Calculator;