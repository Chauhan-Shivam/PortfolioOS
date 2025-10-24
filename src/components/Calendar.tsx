import { useState, forwardRef, useMemo, useCallback, useRef } from "react";
import "../styles/calendar.css";
interface Props {
  open: boolean;
}
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep", "Oct","Nov","Dec",
];
type CalendarView = "days" | "months" | "years";

type SingleGridData = {
  date: Date;
  displayMonth: number;
  displayYear: number;
  decadeStart: number;
  blanks: null[];
  days: number[];
  yearGrid: number[];
};

// --- Helper function to calculate a single grid's data ---
const calculateGridData = (
  baseDate: Date,
  view: CalendarView
): SingleGridData => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  let data: SingleGridData = {
    date: baseDate,
    displayMonth: month,
    displayYear: year,
    decadeStart: 0,
    blanks: [],
    days: [],
    yearGrid: [],
  };

  switch (view) {
    case "days":
      const firstDayOfMonth = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      data.blanks = Array(firstDayOfMonth).fill(null);
      data.days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      break;
    case "months":
      // Nothing extra needed
      break;
    case "years":
      data.decadeStart = Math.floor(year / 10) * 10;
      data.yearGrid = Array.from(
        { length: 10 },
        (_, i) => data.decadeStart + i
      );
      break;
  }
  return data;
};

const Calendar = forwardRef<HTMLDivElement, Props>(({ open }, ref) => {
  // --- 1. Hooks ---
  const [displayDate, setDisplayDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("days");
  const [animationDirection, setAnimationDirection] = useState<
    "zoom-in" | "zoom-out" | "up" | "down" | null
  >(null);

  // --- FIX 1: Re-add the isScrolling ref ---
  // This is our manual lock
  const isScrolling = useRef(false);

  // --- Calculate all three grids (prev, current, next) ---
  const { prevGridData, currentGridData, nextGridData } = useMemo(() => {
    let prevDate: Date;
    let nextDate: Date;

    switch (view) {
      case "days":
        prevDate = new Date(
          displayDate.getFullYear(),
          displayDate.getMonth() - 1,
          1
        );
        nextDate = new Date(
          displayDate.getFullYear(),
          displayDate.getMonth() + 1,
          1
        );
        break;
      case "months":
        prevDate = new Date(
          displayDate.getFullYear() - 1,
          displayDate.getMonth(),
          1
        );
        nextDate = new Date(
          displayDate.getFullYear() + 1,
          displayDate.getMonth(),
          1
        );
        break;
      case "years":
        prevDate = new Date(
          displayDate.getFullYear() - 10,
          displayDate.getMonth(),
          1
        );
        nextDate = new Date(
          displayDate.getFullYear() + 10,
          displayDate.getMonth(),
          1
        );
        break;
    }

    return {
      prevGridData: calculateGridData(prevDate, view),
      currentGridData: calculateGridData(displayDate, view),
      nextGridData: calculateGridData(nextDate, view),
    };
  }, [displayDate, view]);

  // --- "Today" Calculation ---
  const { todayDate, todayMonth, todayYear } = useMemo(() => {
    const now = new Date();
    return {
      todayDate: now.getDate(),
      todayMonth: now.getMonth(),
      todayYear: now.getFullYear(),
    };
  }, []);

  // --- Helper to change date/view and trigger animation ---
  const changeActiveDisplay = useCallback(
    (
      newDate: Date | null,
      newView: CalendarView | null,
      direction: "zoom-in" | "zoom-out" | "up" | "down"
    ) => {
      setAnimationDirection(direction);

      setTimeout(() => {
        if (newDate) setDisplayDate(newDate);
        if (newView) setView(newView);
        setAnimationDirection(null); // Reset animation state
      }, 250); // Matches CSS transition duration
    },
    []
  );

  // --- Handlers ---
  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
    },
    []
  );

  const handlePrev = useCallback(() => {
    // We check the lock here too, to prevent clicks
    // during a scroll animation.
    if (isScrolling.current) return;
    changeActiveDisplay(prevGridData.date, null, "up");
  }, [changeActiveDisplay, prevGridData.date]);

  const handleNext = useCallback(() => {
    // We check the lock here too
    if (isScrolling.current) return;
    changeActiveDisplay(nextGridData.date, null, "down");
  }, [changeActiveDisplay, nextGridData.date]);

  const handleHeaderClick = useCallback(() => {
    if (isScrolling.current) return;
    if (view === "days") changeActiveDisplay(null, "months", "zoom-out");
    if (view === "months") changeActiveDisplay(null, "years", "zoom-out");
  }, [view, changeActiveDisplay]);

  const handleSelectMonth = useCallback(
    (monthIndex: number) => {
      if (isScrolling.current) return;
      const newDate = new Date(currentGridData.displayYear, monthIndex, 1);
      changeActiveDisplay(newDate, "days", "zoom-in");
    },
    [currentGridData.displayYear, changeActiveDisplay]
  );

  const handleSelectYear = useCallback(
    (year: number) => {
      if (isScrolling.current) return;
      const newDate = new Date(year, currentGridData.displayMonth, 1);
      changeActiveDisplay(newDate, "months", "zoom-in");
    },
    [currentGridData.displayMonth, changeActiveDisplay]
  );

  // --- ============================================ ---
  // --- THIS IS THE CORRECTED FUNCTION ---
  // --- ============================================ ---
  const handleWheelScroll = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (view !== "days") return;

      e.preventDefault();

      // --- FIX 2: Use the isScrolling.current ref as the lock ---
      if (isScrolling.current) {
        return;
      }
      // Set the lock
      isScrolling.current = true;

      // Determine direction and trigger animation
      if (e.deltaY > 1) {
        // Scroll down -> next month
        changeActiveDisplay(nextGridData.date, null, "down");
      } else if (e.deltaY < -1) {
        // Scroll up -> prev month
        changeActiveDisplay(prevGridData.date, null, "up");
      } else {
        // No significant scroll, release the lock immediately
        isScrolling.current = false;
        return;
      }

      // --- FIX 3: Release the lock after a "cooldown" period ---
      // This duration MUST be longer than the 250ms animation
      // to prevent race conditions.
      setTimeout(() => {
        isScrolling.current = false;
      }, 350); // 350ms is a safe cooldown
    },
    // Dependencies no longer need animationDirection
    [view, changeActiveDisplay, prevGridData.date, nextGridData.date]
  );

  // --- Memoized Header String ---
  const headerString = useMemo(() => {
    switch (view) {
      case "days":
        return currentGridData.date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
      case "months":
        return currentGridData.displayYear;
      case "years":
        return `${currentGridData.decadeStart} - ${
          currentGridData.decadeStart + 9
        }`;
    }
  }, [view, currentGridData]);

  // --- Conditional Return ---
  if (!open) {
    return null;
  }

  // --- Render Function for Grids ---
  const renderGrid = (gridData: SingleGridData, isPrevNext = false) => {
    const keyPrefix = isPrevNext ? "prev-next-" : "";

    switch (view) {
      case "days":
        return (
          <div
            className="calendar-grid day-grid"
            key={`${keyPrefix}days-${gridData.date.toISOString()}`}
          >
            {DAY_NAMES.map((day: string) => (
              <div key={day} className="day-name">
                {day}
              </div>
            ))}
            {gridData.blanks.map((_, i) => (
              <div
                key={`blank-${gridData.date.getMonth()}-${i}`}
                className="calendar-cell blank-cell"
              />
            ))}
            {gridData.days.map((day: number) => {
              const isToday =
                day === todayDate &&
                gridData.displayMonth === todayMonth &&
                gridData.displayYear === todayYear;
              const className = `calendar-cell day-number ${
                isToday ? "today" : ""
              }`;
              return (
                <div
                  key={`${gridData.date.getMonth()}-${day}`}
                  className={className}
                >
                  {day}
                </div>
              );
            })}
          </div>
        );
      case "months":
        return (
          <div
            className="calendar-grid month-grid"
            key={`${keyPrefix}months-${gridData.displayYear}`}
          >
            {MONTH_NAMES.map((month, index) => {
              const isCurrentMonth =
                index === todayMonth && gridData.displayYear === todayYear;
              const className = `calendar-cell month-cell ${
                isCurrentMonth ? "today" : ""
              }`;
              return (
                <div
                  key={month}
                  className={className}
                  onClick={() => !isPrevNext && handleSelectMonth(index)}
                >
                  {month}
                </div>
              );
            })}
          </div>
        );
      case "years":
        return (
          <div
            className="calendar-grid year-grid"
            key={`${keyPrefix}years-${gridData.decadeStart}`}
          >
            {gridData.yearGrid.map((year: number) => {
              const isCurrentYear = year === todayYear;
              const className = `calendar-cell year-cell ${
                isCurrentYear ? "today" : ""
              }`;
              return (
                <div
                  key={year}
                  className={className}
                  onClick={() => !isPrevNext && handleSelectYear(year)}
                >
                  {year}
                </div>
              );
            })}
          </div>
        );
      default:
        return null;
    }
  };

  // --- FINAL JSX ---
  return (
    <div
      className="calendar-popup"
      ref={ref}
      onClick={handleContainerClick}
      onWheel={handleWheelScroll}
    >
      <div className="calendar-header">
        <button onClick={handlePrev} className="nav-btn">
          &lt;
        </button>
        <span className="header-title clickable" onClick={handleHeaderClick}>
          {headerString}
        </span>
        <button onClick={handleNext} className="nav-btn">
          &gt;
        </button>
      </div>

      <div className={`calendar-content-wrapper ${animationDirection || ""}`}>
        <div className="calendar-grid-container previous-view">
          {renderGrid(prevGridData, true)}
        </div>
        <div className="calendar-grid-container current-view">
          {renderGrid(currentGridData)}
        </div>
        <div className="calendar-grid-container next-view">
          {renderGrid(nextGridData, true)}
        </div>
      </div>
    </div>
  );
});

export default Calendar;
