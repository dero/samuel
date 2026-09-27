import namedaysRaw from './namedaysRaw.json';

export interface DayRecord {
  month: number;
  day: number;
  namesCz: string[];
  holidayCz?: string;
  namesSk: string[];
  holidaySk?: string;
}

export interface ZodiacSign {
  id: string;
  name: string;
  latin: string;
  symbol: string;
  element: 'Oheň' | 'Země' | 'Vzduch' | 'Voda';
  range: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export interface MoonPhaseInfo {
  phase: number; // 0.0 - 1.0
  phaseName: 'Dorůstá' | 'Úplněk' | 'Couvá' | 'Nov';
  icon: string;
}

export interface DayDetail {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  dayOfWeek: number; // 1 = Pondělí ... 7 = Neděle
  dayOfWeekName: string;
  dayOfWeekShort: string;
  monthName: string;
  monthNameGenitive: string;
  monthShort: string;
  isLeapYear: boolean;
  dayOfYear: number;
  daysRemainingInYear: number;
  totalDaysInYear: number;
  weekNumber: number; // ISO 8601 week number (1-53)
  namesCz: string[];
  holidayCz?: string;
  movableHoliday?: string;
  zodiac: ZodiacSign;
  moonPhase: MoonPhaseInfo;
}

export interface SearchMatch {
  dayDetail: DayDetail;
  matchReason: string;
  matchedName: string;
  score: number; // higher = better match
}

export const MONTH_NAMES = [
  'Leden',
  'Únor',
  'Březen',
  'Duben',
  'Květen',
  'Červen',
  'Červenec',
  'Srpen',
  'Září',
  'Říjen',
  'Listopad',
  'Prosinec'
];

export const MONTH_NAMES_GENITIVE = [
  'ledna',
  'února',
  'března',
  'dubna',
  'května',
  'června',
  'července',
  'srpna',
  'září',
  'října',
  'listopadu',
  'prosince'
];

export const MONTH_SHORT = [
  'Led',
  'Úno',
  'Bře',
  'Dub',
  'Kvě',
  'Čvn',
  'Čvc',
  'Srp',
  'Zář',
  'Říj',
  'Lis',
  'Pro'
];

export const DAY_NAMES = [
  'Pondělí',
  'Úterý',
  'Středa',
  'Čtvrtek',
  'Pátek',
  'Sobota',
  'Neděle'
];

export const DAY_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    id: 'capricorn',
    name: 'Kozoroh',
    latin: 'Capricorn',
    symbol: '♑',
    element: 'Země',
    range: '22. 12. – 20. 1.',
    startMonth: 12,
    startDay: 22,
    endMonth: 1,
    endDay: 20
  },
  {
    id: 'aquarius',
    name: 'Vodnář',
    latin: 'Aquarius',
    symbol: '♒',
    element: 'Vzduch',
    range: '21. 1. – 20. 2.',
    startMonth: 1,
    startDay: 21,
    endMonth: 2,
    endDay: 20
  },
  {
    id: 'pisces',
    name: 'Ryby',
    latin: 'Pisces',
    symbol: '♓',
    element: 'Voda',
    range: '21. 2. – 20. 3.',
    startMonth: 2,
    startDay: 21,
    endMonth: 3,
    endDay: 20
  },
  {
    id: 'aries',
    name: 'Beran',
    latin: 'Aries',
    symbol: '♈',
    element: 'Oheň',
    range: '21. 3. – 20. 4.',
    startMonth: 3,
    startDay: 21,
    endMonth: 4,
    endDay: 20
  },
  {
    id: 'taurus',
    name: 'Býk',
    latin: 'Taurus',
    symbol: '♉',
    element: 'Země',
    range: '21. 4. – 21. 5.',
    startMonth: 4,
    startDay: 21,
    endMonth: 5,
    endDay: 21
  },
  {
    id: 'gemini',
    name: 'Blíženci',
    latin: 'Gemini',
    symbol: '♊',
    element: 'Vzduch',
    range: '22. 5. – 21. 6.',
    startMonth: 5,
    startDay: 22,
    endMonth: 6,
    endDay: 21
  },
  {
    id: 'cancer',
    name: 'Rak',
    latin: 'Cancer',
    symbol: '♋',
    element: 'Voda',
    range: '22. 6. – 22. 7.',
    startMonth: 6,
    startDay: 22,
    endMonth: 7,
    endDay: 22
  },
  {
    id: 'leo',
    name: 'Lev',
    latin: 'Leo',
    symbol: '♌',
    element: 'Oheň',
    range: '23. 7. – 22. 8.',
    startMonth: 7,
    startDay: 23,
    endMonth: 8,
    endDay: 22
  },
  {
    id: 'virgo',
    name: 'Panna',
    latin: 'Virgo',
    symbol: '♍',
    element: 'Země',
    range: '23. 8. – 22. 9.',
    startMonth: 8,
    startDay: 23,
    endMonth: 9,
    endDay: 22
  },
  {
    id: 'libra',
    name: 'Váhy',
    latin: 'Libra',
    symbol: '♎',
    element: 'Vzduch',
    range: '23. 9. – 23. 10.',
    startMonth: 9,
    startDay: 23,
    endMonth: 10,
    endDay: 23
  },
  {
    id: 'scorpio',
    name: 'Štír',
    latin: 'Scorpio',
    symbol: '♏',
    element: 'Voda',
    range: '24. 10. – 22. 11.',
    startMonth: 10,
    startDay: 24,
    endMonth: 11,
    endDay: 22
  },
  {
    id: 'sagittarius',
    name: 'Střelec',
    latin: 'Sagittarius',
    symbol: '♐',
    element: 'Oheň',
    range: '23. 11. – 21. 12.',
    startMonth: 11,
    startDay: 23,
    endMonth: 12,
    endDay: 21
  }
];

const NAMEDAYS: DayRecord[] = namedaysRaw as DayRecord[];

// Fast lookup map by `${m}-${d}`
const NAMEDAYS_MAP = new Map<string, DayRecord>();
for (const entry of NAMEDAYS) {
  NAMEDAYS_MAP.set(`${entry.month}-${entry.day}`, entry);
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

const DAYS_IN_MONTH_NON_LEAP = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function getDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return DAYS_IN_MONTH_NON_LEAP[month - 1] ?? 31;
}

const MONTH_OFFSETS_NON_LEAP = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const MONTH_OFFSETS_LEAP = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

export function getDayOfYear(year: number, month: number, day: number): number {
  const offsets = isLeapYear(year) ? MONTH_OFFSETS_LEAP : MONTH_OFFSETS_NON_LEAP;
  return offsets[month - 1] + day;
}

export function getDayOfYearVariants(month: number, day: number): { nonLeap: number; leap: number } {
  return {
    nonLeap: MONTH_OFFSETS_NON_LEAP[month - 1] + day,
    leap: MONTH_OFFSETS_LEAP[month - 1] + day
  };
}

export function getDateFromDayOfYear(year: number, dayOfYear: number): { month: number; day: number } {
  const isLeap = isLeapYear(year);
  const totalDays = isLeap ? 366 : 365;
  const clampedDay = Math.max(1, Math.min(totalDays, dayOfYear));

  let remaining = clampedDay;
  for (let m = 1; m <= 12; m++) {
    const daysInM = getDaysInMonth(year, m);
    if (remaining <= daysInM) {
      return { month: m, day: remaining };
    }
    remaining -= daysInM;
  }
  return { month: 12, day: 31 };
}

/**
 * 1 = Monday ... 7 = Sunday
 */
export function getDayOfWeek(year: number, month: number, day: number): number {
  const d = new Date(Date.UTC(year, month - 1, day));
  const dow = d.getUTCDay();
  return dow === 0 ? 7 : dow;
}

export function getIsoWeek(year: number, month: number, day: number): number {
  const d = new Date(Date.UTC(year, month - 1, day));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getZodiacSign(month: number, day: number): ZodiacSign {
  for (const sign of ZODIAC_SIGNS) {
    if (sign.startMonth === 12 && sign.endMonth === 1) {
      if ((month === 12 && day >= sign.startDay) || (month === 1 && day <= sign.endDay)) {
        return sign;
      }
    } else if (
      (month === sign.startMonth && day >= sign.startDay) ||
      (month === sign.endMonth && day <= sign.endDay)
    ) {
      return sign;
    }
  }
  return ZODIAC_SIGNS[0];
}

export function getEasterDate(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

export function getMovableHoliday(year: number, month: number, day: number): string | undefined {
  const easter = getEasterDate(year);
  const easterDate = new Date(Date.UTC(year, easter.month - 1, easter.day));

  // Velký pátek = Easter - 2 days
  const goodFriday = new Date(easterDate.getTime() - 2 * 86400000);
  if (goodFriday.getUTCMonth() + 1 === month && goodFriday.getUTCDate() === day) {
    return 'Velký pátek';
  }

  // Velikonoční neděle
  if (easter.month === month && easter.day === day) {
    return 'Boží hod velikonoční';
  }

  // Velikonoční pondělí = Easter + 1 day
  const easterMonday = new Date(easterDate.getTime() + 1 * 86400000);
  if (easterMonday.getUTCMonth() + 1 === month && easterMonday.getUTCDate() === day) {
    return 'Velikonoční pondělí';
  }

  return undefined;
}

/**
 * Meeus Chapter 49 (Phases of the Moon) algorithm.
 * Computes exact Julian Ephemeris Day (JDE) for:
 * phase = 0.0 -> New Moon (Nov)
 * phase = 0.5 -> Full Moon (Úplněk)
 */
function moonPhaseJde(k: number, phase: number): number {
  const kp = k + phase;
  const T = kp / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  const jde =
    2451550.09766 +
    29.530588861 * kp +
    0.00015437 * T2 -
    0.00000015 * T3 +
    0.00000000073 * T4;

  const M = ((2.5534 + 29.1053567 * kp - 0.0000014 * T2 - 0.00000011 * T3) * Math.PI) / 180;
  const Mp =
    ((201.5643 + 385.81693528 * kp + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4) *
      Math.PI) /
    180;
  const F =
    ((160.7108 + 390.67050284 * kp - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4) *
      Math.PI) /
    180;
  const Omega = ((124.7746 - 1.56375588 * kp + 0.0020672 * T2 + 0.00000215 * T3) * Math.PI) / 180;

  let corr = 0;
  if (phase === 0.5) {
    // Full Moon (opposition) periodic corrections
    corr =
      -0.40614 * Math.sin(Mp) +
      0.17302 * Math.sin(M) +
      0.01614 * Math.sin(2 * Mp) +
      0.01043 * Math.sin(2 * F) -
      0.00734 * Math.sin(Mp - M) -
      0.00514 * Math.sin(Mp + M) +
      0.00209 * Math.sin(2 * M) -
      0.00111 * Math.sin(Mp - 2 * F) -
      0.00057 * Math.sin(Mp + 2 * F) +
      0.00056 * Math.sin(2 * Mp + M) -
      0.00042 * Math.sin(3 * Mp) +
      0.00042 * Math.sin(M + 2 * F) +
      0.00038 * Math.sin(M - 2 * F) -
      0.00024 * Math.sin(2 * Mp - M) -
      0.00017 * Math.sin(Omega);
  } else {
    // New Moon (conjunction) periodic corrections
    corr =
      -0.4072 * Math.sin(Mp) +
      0.17241 * Math.sin(M) +
      0.01608 * Math.sin(2 * Mp) +
      0.01039 * Math.sin(2 * F) +
      0.00739 * Math.sin(Mp - M) -
      0.00514 * Math.sin(Mp + M) +
      0.00208 * Math.sin(2 * M) -
      0.00111 * Math.sin(Mp - 2 * F) -
      0.00057 * Math.sin(Mp + 2 * F) +
      0.00056 * Math.sin(2 * Mp + M) -
      0.00042 * Math.sin(3 * Mp) +
      0.00042 * Math.sin(M + 2 * F) +
      0.00038 * Math.sin(M - 2 * F) -
      0.00024 * Math.sin(2 * Mp - M) -
      0.00017 * Math.sin(Omega);
  }
  return jde + corr;
}

/**
 * Converts Julian Ephemeris Day to local Czech calendar date YYYY-MM-DD (Europe/Prague).
 */
function jdeToPragueDate(jde: number): string {
  const ms = (jde - 2440587.5) * 86400000;
  try {
    return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' });
  } catch {
    const dUtc = new Date(ms);
    const yr = dUtc.getUTCFullYear();
    const marchSun = 31 - new Date(Date.UTC(yr, 2, 31)).getUTCDay();
    const octSun = 31 - new Date(Date.UTC(yr, 9, 31)).getUTCDay();
    const isCest = ms >= Date.UTC(yr, 2, marchSun, 1, 0) && ms < Date.UTC(yr, 9, octSun, 1, 0);
    const local = new Date(ms + (isCest ? 2 : 1) * 3600000);
    const y = local.getUTCFullYear();
    const m = String(local.getUTCMonth() + 1).padStart(2, '0');
    const d = String(local.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Returns canonical moon phase for a given date in Czech Republic (Europe/Prague).
 * Exactly ONE day per lunation is designated as 'Úplněk' (Full Moon).
 * Exactly ONE day per lunation is designated as 'Nov' (New Moon).
 * Waxing days are 'Dorůstá', waning days are 'Couvá'.
 */
export function getMoonPhase(year: number, month: number, day: number): MoonPhaseInfo {
  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');
  const dateStr = `${year}-${mStr}-${dStr}`;
  const approxK = Math.round((year + (month - 1) / 12 + day / 365.25 - 2000) * 12.3685);

  // 1. Check if today is the exact canonical day of Full Moon or New Moon in Prague
  for (let dk = -2; dk <= 2; dk++) {
    const k = approxK + dk;
    if (jdeToPragueDate(moonPhaseJde(k, 0.5)) === dateStr) {
      return { phase: 0.5, phaseName: 'Úplněk', icon: '🌕' };
    }
    if (jdeToPragueDate(moonPhaseJde(k, 0.0)) === dateStr) {
      return { phase: 0.0, phaseName: 'Nov', icon: '🌑' };
    }
  }

  // 2. Not an exact day of Full or New Moon. Determine whether currently waxing or waning.
  let prevEvent: { type: 'new' | 'full'; date: string } | null = null;
  for (let dk = -3; dk <= 3; dk++) {
    const k = approxK + dk;
    const newDate = jdeToPragueDate(moonPhaseJde(k, 0.0));
    if (newDate < dateStr && (!prevEvent || newDate > prevEvent.date)) {
      prevEvent = { type: 'new', date: newDate };
    }
    const fullDate = jdeToPragueDate(moonPhaseJde(k, 0.5));
    if (fullDate < dateStr && (!prevEvent || fullDate > prevEvent.date)) {
      prevEvent = { type: 'full', date: fullDate };
    }
  }

  if (prevEvent && prevEvent.type === 'new') {
    return { phase: 0.25, phaseName: 'Dorůstá', icon: '🌓' };
  } else {
    return { phase: 0.75, phaseName: 'Couvá', icon: '🌗' };
  }
}

export function getDayRecord(month: number, day: number): DayRecord {
  const rec = NAMEDAYS_MAP.get(`${month}-${day}`);
  if (rec) return rec;
  return {
    month,
    day,
    namesCz: [],
    namesSk: []
  };
}

export function getDayDetail(year: number, month: number, day: number): DayDetail {
  const isLeap = isLeapYear(year);
  const totalDays = isLeap ? 366 : 365;
  const dayOfYear = getDayOfYear(year, month, day);
  const daysRemaining = totalDays - dayOfYear;
  const dow = getDayOfWeek(year, month, day);
  const rec = getDayRecord(month, day);
  const zodiac = getZodiacSign(month, day);
  const moonPhase = getMoonPhase(year, month, day);
  const weekNumber = getIsoWeek(year, month, day);
  const movableHoliday = getMovableHoliday(year, month, day);

  return {
    year,
    month,
    day,
    dayOfWeek: dow,
    dayOfWeekName: DAY_NAMES[dow - 1],
    dayOfWeekShort: DAY_SHORT[dow - 1],
    monthName: MONTH_NAMES[month - 1],
    monthNameGenitive: MONTH_NAMES_GENITIVE[month - 1],
    monthShort: MONTH_SHORT[month - 1],
    isLeapYear: isLeap,
    dayOfYear,
    daysRemainingInYear: daysRemaining,
    totalDaysInYear: totalDays,
    weekNumber,
    namesCz: rec.namesCz,
    holidayCz: rec.holidayCz,
    movableHoliday,
    zodiac,
    moonPhase
  };
}

export function removeDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Helper to parse potential (day, month) pairs from query.
 * Handles:
 * - "12.3", "12/3", "12 3", "12-3", "12.3."
 * - "12" -> 1. 2.
 * - "123" -> 12. 3. (try DD+M first, then D+MM)
 * - "2412" -> 24. 12.
 */
function parsePossibleDates(rawQ: string, year: number): { day: number; month: number }[] {
  const dates: { day: number; month: number }[] = [];
  const seen = new Set<string>();

  function addDate(d: number, m: number) {
    if (m >= 1 && m <= 12) {
      const maxDays = getDaysInMonth(year, m);
      if (d >= 1 && d <= maxDays) {
        const key = `${m}-${d}`;
        if (!seen.has(key)) {
          seen.add(key);
          dates.push({ day: d, month: m });
        }
      }
    }
  }

  // A. Formats with explicit separators: "12.3", "12/3", "12 3", "12-3", "12.3."
  const sepMatch = rawQ.match(/^(\d{1,2})[./\s-](\d{1,2})\.?$/);
  if (sepMatch) {
    addDate(parseInt(sepMatch[1], 10), parseInt(sepMatch[2], 10));
    return dates;
  }

  // B. Pure digit sequences (e.g. from A36 keypad)
  if (/^\d{2,4}$/.test(rawQ)) {
    if (rawQ.length === 2) {
      // e.g. "12" -> 1. 2.
      addDate(parseInt(rawQ[0], 10), parseInt(rawQ[1], 10));
    } else if (rawQ.length === 3) {
      // e.g. "123" -> 12. 3. (try DD+M first)
      addDate(parseInt(rawQ.slice(0, 2), 10), parseInt(rawQ.slice(2), 10));
      // then try D+MM (e.g. "311" -> 3. 11.)
      addDate(parseInt(rawQ.slice(0, 1), 10), parseInt(rawQ.slice(1), 10));
    } else if (rawQ.length === 4) {
      // e.g. "2412" -> 24. 12.
      addDate(parseInt(rawQ.slice(0, 2), 10), parseInt(rawQ.slice(2), 10));
    }
  }

  return dates;
}

/**
 * Searches the calendar database for matches according to query string:
 * 1. Priority 1: Date matches (e.g. 123 -> 12. 3., 24.12 -> 24. 12.)
 * 2. Priority 2: Czech names and holidays (STRICT PREFIX ONLY)
 * 3. Priority 3: Day of year (e.g. 123 -> 123. den v roce)
 */
export function searchCalendar(
  query: string,
  options?: {
    year?: number;
    limit?: number;
  }
): SearchMatch[] {
  const rawQ = query.trim();
  if (!rawQ) return [];

  const year = options?.year ?? new Date().getFullYear();
  const limit = options?.limit ?? 30;
  const results: SearchMatch[] = [];
  const seenKeys = new Set<string>();

  // 1. Highest Priority: DATE MATCHES (score = 2000)
  const possibleDates = parsePossibleDates(rawQ, year);
  for (const dateItem of possibleDates) {
    const detail = getDayDetail(year, dateItem.month, dateItem.day);
    const mainName = detail.namesCz[0] || detail.holidayCz || `${dateItem.day}. ${dateItem.month}.`;
    const key = `${dateItem.month}-${dateItem.day}`;
    seenKeys.add(key);
    results.push({
      dayDetail: detail,
      matchReason: `Datum ${dateItem.day}. ${dateItem.month}.`,
      matchedName: mainName,
      score: 2000
    });
  }

  // 2. Medium-High Priority: Text search in Czech names and holidays (STRICT PREFIX ONLY)
  const cleanQ = removeDiacritics(rawQ).toUpperCase();
  if (cleanQ.length > 0 && !/^\d+$/.test(rawQ)) {
    for (const entry of NAMEDAYS) {
      let bestScore = 0;
      let matchedName = '';
      let matchReason = '';

      for (const name of entry.namesCz) {
        const cleanName = removeDiacritics(name).toUpperCase();
        if (cleanName === cleanQ) {
          bestScore = Math.max(bestScore, 1500);
          matchedName = name;
          matchReason = 'Přesné jméno';
        } else if (cleanName.startsWith(cleanQ)) {
          const prefixScore = 1000 + Math.round((cleanQ.length / cleanName.length) * 400);
          if (prefixScore > bestScore) {
            bestScore = prefixScore;
            matchedName = name;
            matchReason = 'Začátek jména';
          }
        }
      }

      if (entry.holidayCz) {
        const cleanH = removeDiacritics(entry.holidayCz).toUpperCase();
        if (cleanH === cleanQ) {
          if (bestScore < 1450) {
            bestScore = 1450;
            matchedName = entry.holidayCz;
            matchReason = 'Státní svátek ČR';
          }
        } else if (cleanH.startsWith(cleanQ)) {
          if (bestScore < 1050) {
            bestScore = 1050;
            matchedName = entry.holidayCz;
            matchReason = 'Státní svátek ČR';
          }
        }
      }

      if (bestScore > 0) {
        const key = `${entry.month}-${entry.day}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          const detail = getDayDetail(year, entry.month, entry.day);
          results.push({
            dayDetail: detail,
            matchReason,
            matchedName,
            score: bestScore
          });
        }
      }
    }
  }

  // 3. Lower Priority: Day of year (score = 800)
  if (/^\d{1,3}$/.test(rawQ)) {
    const num = parseInt(rawQ, 10);
    const maxDays = isLeapYear(year) ? 366 : 365;
    if (num >= 1 && num <= maxDays) {
      const dateInfo = getDateFromDayOfYear(year, num);
      const key = `${dateInfo.month}-${dateInfo.day}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        const detail = getDayDetail(year, dateInfo.month, dateInfo.day);
        const mainName = detail.namesCz[0] || detail.holidayCz || `${num}. den`;
        results.push({
          dayDetail: detail,
          matchReason: `${num}. den v roce`,
          matchedName: mainName,
          score: 800
        });
      }
    }
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.dayDetail.month !== b.dayDetail.month) return a.dayDetail.month - b.dayDetail.month;
    return a.dayDetail.day - b.dayDetail.day;
  });

  return results.slice(0, limit);
}

/**
 * Calculates day difference between two dates: (Date B - Date A)
 */
export function calculateDateDifference(
  from: { year: number; month: number; day: number },
  to: { year: number; month: number; day: number }
): {
  days: number;
  weeks: number;
  remainingDays: number;
  isNegative: boolean;
} {
  const dateFrom = Date.UTC(from.year, from.month - 1, from.day);
  const dateTo = Date.UTC(to.year, to.month - 1, to.day);
  const diffMs = dateTo - dateFrom;
  const totalDays = Math.round(diffMs / 86400000);
  const absDays = Math.abs(totalDays);
  const weeks = Math.floor(absDays / 7);
  const rem = absDays % 7;

  return {
    days: totalDays,
    weeks,
    remainingDays: rem,
    isNegative: totalDays < 0
  };
}

/**
 * Adds (or subtracts) N days to a date, returning the target Date components
 */
export function addDays(
  base: { year: number; month: number; day: number },
  daysOffset: number
): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(base.year, base.month - 1, base.day));
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate()
  };
}
