import { CONFIG } from '../config';
import { eventBus } from '../core/EventBus';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];
const TICKS_PER_DAY = CONFIG.TICKS_PER_HOUR * CONFIG.HOURS_PER_DAY;
const TICKS_PER_SEASON = TICKS_PER_DAY * CONFIG.DAYS_PER_SEASON;
const TICKS_PER_YEAR = TICKS_PER_SEASON * CONFIG.SEASONS_PER_YEAR;

export class TimeManager {
  private totalTicks: number;
  private lastHour: number;
  private lastDay: number;
  private lastSeasonIndex: number;
  private lastYear: number;

  constructor(startTick: number = 0) {
    this.totalTicks = startTick;
    this.lastHour = this.hour;
    this.lastDay = this.day;
    this.lastSeasonIndex = this.seasonIndex;
    this.lastYear = this.year;
  }

  update(): void {
    this.totalTicks++;

    const currentHour = this.hour;
    const currentDay = this.day;
    const currentSeasonIdx = this.seasonIndex;
    const currentYear = this.year;

    if (currentHour !== this.lastHour) {
      eventBus.emit('time:hour', { hour: currentHour });
      this.lastHour = currentHour;
    }
    if (currentDay !== this.lastDay) {
      eventBus.emit('time:day', { day: currentDay });
      this.lastDay = currentDay;
    }
    if (currentSeasonIdx !== this.lastSeasonIndex) {
      eventBus.emit('time:season', { season: this.season, index: currentSeasonIdx });
      this.lastSeasonIndex = currentSeasonIdx;
    }
    if (currentYear !== this.lastYear) {
      eventBus.emit('time:year', { year: currentYear });
      this.lastYear = currentYear;
    }
  }

  get tick(): number {
    return this.totalTicks;
  }

  get hour(): number {
    return Math.floor(
      (this.totalTicks % TICKS_PER_DAY) / CONFIG.TICKS_PER_HOUR,
    );
  }

  get day(): number {
    return Math.floor(
      (this.totalTicks % TICKS_PER_SEASON) / TICKS_PER_DAY,
    );
  }

  get season(): Season {
    return SEASONS[this.seasonIndex];
  }

  get seasonIndex(): number {
    return Math.floor(
      (this.totalTicks % TICKS_PER_YEAR) / TICKS_PER_SEASON,
    );
  }

  get year(): number {
    return Math.floor(this.totalTicks / TICKS_PER_YEAR);
  }

  get timeOfDay(): TimeOfDay {
    const h = this.hour;
    if (h >= 5 && h < 7) return 'dawn';
    if (h >= 7 && h < 17) return 'day';
    if (h >= 17 && h < 19) return 'dusk';
    return 'night';
  }

  get dayProgress(): number {
    return (this.totalTicks % TICKS_PER_DAY) / TICKS_PER_DAY;
  }

  get seasonProgress(): number {
    return (this.totalTicks % TICKS_PER_SEASON) / TICKS_PER_SEASON;
  }

  get daylightFactor(): number {
    const h = this.hour + (this.totalTicks % CONFIG.TICKS_PER_HOUR) / CONFIG.TICKS_PER_HOUR;
    // Peak at noon (12), dark at midnight (0/24)
    // Map 0-24 to a sine wave: 0 at midnight, 1 at noon
    const normalized = (h - 6) / 12; // -0.5 to 1.5
    return Math.max(0, Math.min(1, Math.sin(normalized * Math.PI)));
  }

  getTemperatureModifier(): number {
    switch (this.season) {
      case 'spring': return 0.0;
      case 'summer': return 0.2;
      case 'autumn': return -0.1;
      case 'winter': return -0.3;
    }
  }

  getResourceModifier(): number {
    switch (this.season) {
      case 'spring': return 1.2;
      case 'summer': return 1.0;
      case 'autumn': return 0.8;
      case 'winter': return 0.3;
    }
  }
}
