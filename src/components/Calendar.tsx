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
  const [displayDate, setDisplayDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("days");
  const [animationDirection, setAnimationDirection] = useState<
    "zoom-in" | "zoom-out" | "up" | "down" | null
  >(null);

  const isScrolling = useRef(false);

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

  const { todayDate, todayMonth, todayYear } = useMemo(() => {
    const now = new Date();
    return {
      todayDate: now.getDate(),
      todayMonth: now.getMonth(),
      todayYear: now.getFullYear(),
    };
  }, []);
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
        setAnimationDirection(null); 
      }, 250);
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
    if (isScrolling.current) return;
    changeActiveDisplay(prevGridData.date, null, "up");
  }, [changeActiveDisplay, prevGridData.date]);

  const handleNext = useCallback(() => {
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

  const handleWheelScroll = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (view !== "days") return;

      e.preventDefault();

      if (isScrolling.current) {
        return;
      }
      isScrolling.current = true;
      if (e.deltaY > 1) {
        changeActiveDisplay(nextGridData.date, null, "down");
      } else if (e.deltaY < -1) {
        changeActiveDisplay(prevGridData.date, null, "up");
      } else {
        isScrolling.current = false;
        return;
      }

      setTimeout(() => {
        isScrolling.current = false;
      }, 350);
    },
    [view, changeActiveDisplay, prevGridData.date, nextGridData.date]
  );

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

  if (!open) {
    return null;
  }

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
