import { useState, forwardRef, useMemo, useCallback } from 'react';
import '../styles/calendar.css';

interface Props {
  open: boolean;
}
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const Calendar = forwardRef<HTMLDivElement, Props>(({ open }, ref) => {
  if (!open) return null;

  const [displayDate, setDisplayDate] = useState(new Date());

  const handlePrevMonth = useCallback(() => {
    setDisplayDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setDisplayDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  }, []);

  const headerString = useMemo(() => {
    return displayDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [displayDate]);

  const { blanks, days, currentDisplayMonth, currentDisplayYear } = useMemo(() => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return {
      blanks,
      days,
      currentDisplayMonth: month,
      currentDisplayYear: year,
    };
  }, [displayDate]);

  const now = new Date();
  const todayDate = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  return (
    <div
      className="calendar-popup glass"
      ref={ref}
      onClick={handleContainerClick}
    >
      <div className="calendar-header">
        <button onClick={handlePrevMonth}>&lt;</button> {/* Use stable handler */}
        <span>{headerString}</span> {/* Use memoized value */}
        <button onClick={handleNextMonth}>&gt;</button> {/* Use stable handler */}
      </div>
      <div className="calendar-grid">
        {DAY_NAMES.map(day => (
          <div key={day} className="day-name">
            {day}
          </div>
        ))}
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map(day => {

          const isToday =
            day === todayDate &&
            currentDisplayMonth === todayMonth &&
            currentDisplayYear === todayYear;

          const className = isToday ? 'day-number today' : 'day-number';

          return (
            <div key={day} className={className}>
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
});
export default Calendar;