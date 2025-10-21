import { useState, forwardRef } from 'react';
import '../styles/calendar.css';

interface Props {
  open: boolean;
}

const Calendar = forwardRef<HTMLDivElement, Props>(({ open }, ref) => {
  if (!open) return null;

  const [displayDate, setDisplayDate] = useState(new Date());

  const handleMonthChange = (offset: number) => {
    setDisplayDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay();
  const today = new Date();

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="calendar-popup glass" ref={ref} onClick={e => e.stopPropagation()}>
      <div className="calendar-header">
        <button onClick={() => handleMonthChange(-1)}>&lt;</button>
        <span>{displayDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        <button onClick={() => handleMonthChange(1)}>&gt;</button>
      </div>
      <div className="calendar-grid">
        {dayNames.map(day => <div key={day} className="day-name">{day}</div>)}
        {blanks.map((_, i) => <div key={`blank-${i}`} />)}
        {days.map(day => (
          <div 
            key={day} 
            className={`day-number ${
              day === today.getDate() && 
              displayDate.getMonth() === today.getMonth() && 
              displayDate.getFullYear() === today.getFullYear() 
              ? 'today' 
              : ''
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
});

export default Calendar;