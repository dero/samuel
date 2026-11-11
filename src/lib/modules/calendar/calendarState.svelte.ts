import { localSettingsService } from '../../services/localSettingsService';
import {
  getDayDetail,
  searchCalendar,
  calculateDateDifference,
  addDays,
  getDaysInMonth,
  type DayDetail,
  type SearchMatch
} from './calendarData';

export type CalendarFlavour = 'calendar' | 'search' | 'calc';
export type CalcMode = 'offset' | 'diff';

function readToday() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

class CalendarState {
  /** Today's date; refreshed when the app comes back, so an app left open past midnight moves on. */
  today = $state(readToday());

  refreshToday() {
    const next = readToday();
    const t = this.today;
    if (next.year !== t.year || next.month !== t.month || next.day !== t.day) this.today = next;
  }

  private modSettings = localSettingsService.forModule('calendar');

  // Flavour
  activeFlavour = $state<CalendarFlavour>(
    (this.modSettings.getString('flavour', 'calendar') as CalendarFlavour) || 'calendar'
  );

  // Selected date (for calendar and offset base)
  year = $state<number>(
    this.modSettings.getNumber('year', new Date().getFullYear())
  );
  month = $state<number>(
    this.modSettings.getNumber('month', new Date().getMonth() + 1)
  );
  day = $state<number>(
    this.modSettings.getNumber('day', new Date().getDate())
  );

  // Search state
  searchQuery = $state<string>(
    this.modSettings.getString('search_query', '')
  );
  expandedDayKey = $state<string | null>(null);

  // Calculator state
  calcMode = $state<CalcMode>(
    (this.modSettings.getString('calc_mode', 'offset') as CalcMode) || 'offset'
  );
  offsetDays = $state<number>(
    this.modSettings.getNumber('offset_days', 0)
  );
  diffFrom = $state<{ year: number; month: number; day: number }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  });
  diffTo = $state<{ year: number; month: number; day: number }>(
    addDays(
      {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate()
      },
      42
    )
  );

  // Derived properties
  currentDayDetail = $derived<DayDetail>(
    getDayDetail(this.year, this.month, this.day)
  );

  searchMatches = $derived<SearchMatch[]>(
    searchCalendar(this.searchQuery, {
      year: this.year
    })
  );

  // Calculator derived
  offsetTargetDate = $derived<{ year: number; month: number; day: number }>(
    addDays({ year: this.year, month: this.month, day: this.day }, this.offsetDays)
  );

  offsetTargetDetail = $derived<DayDetail>(
    getDayDetail(
      this.offsetTargetDate.year,
      this.offsetTargetDate.month,
      this.offsetTargetDate.day
    )
  );

  diffResult = $derived(
    calculateDateDifference(this.diffFrom, this.diffTo)
  );

  diffFromDetail = $derived<DayDetail>(
    getDayDetail(this.diffFrom.year, this.diffFrom.month, this.diffFrom.day)
  );

  diffToDetail = $derived<DayDetail>(
    getDayDetail(this.diffTo.year, this.diffTo.month, this.diffTo.day)
  );

  constructor() {
    // Auto-save changes
    $effect.root(() => {
      $effect(() => {
        this.modSettings.update({
          flavour: this.activeFlavour,
          year: this.year,
          month: this.month,
          day: this.day,
          search_query: this.searchQuery,
          calc_mode: this.calcMode,
          offset_days: this.offsetDays
        });
      });
    });
  }

  // Actions (the keys and controls that call them vibrate themselves)
  setFlavour(f: CalendarFlavour) {
    this.activeFlavour = f;
  }

  selectDate(year: number, month: number, day: number) {
    this.year = year;
    this.month = month;
    this.day = day;
  }

  setToday() {
    const now = new Date();
    this.year = now.getFullYear();
    this.month = now.getMonth() + 1;
    this.day = now.getDate();
  }

  addSearchChar(char: string) {
    this.searchQuery += char;
    this.expandedDayKey = null;
  }

  backspaceSearch() {
    if (this.searchQuery.length > 0) {
      this.searchQuery = this.searchQuery.slice(0, -1);
      this.expandedDayKey = null;
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.expandedDayKey = null;
  }

  toggleExpandedDay(m: number, d: number) {
    const key = `${m}-${d}`;
    if (this.expandedDayKey === key) {
      this.expandedDayKey = null;
    } else {
      this.expandedDayKey = key;
      this.selectDate(this.year, m, d);
    }
  }

  // Calculator actions
  setCalcMode(m: CalcMode) {
    this.calcMode = m;
  }

  adjustOffset(delta: number) {
    this.offsetDays += delta;
  }

  resetOffset() {
    this.offsetDays = 0;
  }

  adjustDatePart(target: 'from' | 'to', part: 'day' | 'month' | 'year', delta: number) {
    const current = target === 'from' ? { ...this.diffFrom } : { ...this.diffTo };

    if (part === 'year') {
      current.year = Math.max(1, current.year + delta);
      const maxDays = getDaysInMonth(current.year, current.month);
      if (current.day > maxDays) current.day = maxDays;
    } else if (part === 'month') {
      let m = current.month + delta;
      if (m > 12) m = 1;
      else if (m < 1) m = 12;
      current.month = m;
      const maxDays = getDaysInMonth(current.year, current.month);
      if (current.day > maxDays) current.day = maxDays;
    } else if (part === 'day') {
      const maxDays = getDaysInMonth(current.year, current.month);
      let d = current.day + delta;
      if (d > maxDays) d = 1;
      else if (d < 1) d = maxDays;
      current.day = d;
    }

    if (target === 'from') {
      this.diffFrom = current;
    } else {
      this.diffTo = current;
    }
  }

  // Data back to defaults; the flavour and the calculator mode are ways in and stay
  resetModule() {
    this.setToday();
    this.searchQuery = '';
    this.expandedDayKey = null;
    this.offsetDays = 0;
    this.diffFrom = { year: this.year, month: this.month, day: this.day };
    this.diffTo = addDays(this.diffFrom, 42);
  }
}

export const calendarState = new CalendarState();
