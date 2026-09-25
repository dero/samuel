import { localSettingsService } from '../../services/localSettingsService';
import {
  getDayDetail,
  searchCalendar,
  calculateDateDifference,
  addDays,
  type DayDetail,
  type SearchMatch
} from './calendarData';
import { settings } from '../../state/settings.svelte';

export type CalendarFlavour = 'calendar' | 'search' | 'calc';
export type CalcMode = 'offset' | 'diff';

class CalendarState {
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
  activeDiffSlot = $state<'from' | 'to'>('to');
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

  // Actions
  setFlavour(f: CalendarFlavour) {
    if (f === this.activeFlavour) return;
    settings.vibrate(20);
    this.activeFlavour = f;
  }

  selectDate(year: number, month: number, day: number) {
    this.year = year;
    this.month = month;
    this.day = day;
  }

  setYear(year: number) {
    this.year = year;
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
      settings.vibrate(20);
      this.searchQuery = this.searchQuery.slice(0, -1);
      this.expandedDayKey = null;
    }
  }

  clearSearch() {
    settings.vibrate(25);
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
    if (m === this.calcMode) return;
    settings.vibrate(20);
    this.calcMode = m;
  }

  adjustOffset(delta: number) {
    settings.vibrate(20);
    this.offsetDays += delta;
  }

  resetOffset() {
    settings.vibrate(25);
    this.offsetDays = 0;
  }

  adjustDiffActive(delta: number) {
    settings.vibrate(20);
    if (this.activeDiffSlot === 'from') {
      this.diffFrom = addDays(this.diffFrom, delta);
    } else {
      this.diffTo = addDays(this.diffTo, delta);
    }
  }

  swapDiff() {
    settings.vibrate(25);
    const temp = { ...this.diffFrom };
    this.diffFrom = { ...this.diffTo };
    this.diffTo = temp;
  }

  resetDiffToToday() {
    settings.vibrate(25);
    const now = new Date();
    const today = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    if (this.activeDiffSlot === 'from') {
      this.diffFrom = today;
    } else {
      this.diffTo = today;
    }
  }

  resetModule() {
    this.setToday();
    this.searchQuery = '';
    this.expandedDayKey = null;
    this.offsetDays = 0;
    this.diffFrom = { year: this.year, month: this.month, day: this.day };
    this.diffTo = addDays(this.diffFrom, 42);
    this.activeFlavour = 'calendar';
  }
}

export const calendarState = new CalendarState();
