import { CONFIG } from '../config';
import { ActionLogEntry } from './schemas/ActionLog';
import { NeedSnapshot } from './schemas/NeedSnapshot';
import { PopulationEvent } from './schemas/PopulationEvent';

const MAX_LOG_ENTRIES = 10000;

export class DataLogger {
  private actionLogs: ActionLogEntry[];
  private needSnapshots: NeedSnapshot[];
  private populationEvents: PopulationEvent[];
  private logLevel: 'minimal' | 'standard' | 'full';

  constructor(logLevel?: 'minimal' | 'standard' | 'full') {
    this.actionLogs = [];
    this.needSnapshots = [];
    this.populationEvents = [];
    this.logLevel = logLevel ?? CONFIG.LOG_LEVEL;
  }

  logAction(entry: ActionLogEntry): void {
    if (this.logLevel === 'minimal') return;
    this.actionLogs.push(entry);
    if (this.actionLogs.length > MAX_LOG_ENTRIES) {
      this.actionLogs = this.actionLogs.slice(-MAX_LOG_ENTRIES);
    }
  }

  logNeeds(snapshot: NeedSnapshot): void {
    if (this.logLevel !== 'full') return;
    this.needSnapshots.push(snapshot);
    if (this.needSnapshots.length > MAX_LOG_ENTRIES) {
      this.needSnapshots = this.needSnapshots.slice(-MAX_LOG_ENTRIES);
    }
  }

  logPopulationEvent(event: PopulationEvent): void {
    this.populationEvents.push(event);
    if (this.populationEvents.length > MAX_LOG_ENTRIES) {
      this.populationEvents = this.populationEvents.slice(-MAX_LOG_ENTRIES);
    }
  }

  getActionLogs(): readonly ActionLogEntry[] {
    return this.actionLogs;
  }

  getPopulationEvents(): readonly PopulationEvent[] {
    return this.populationEvents;
  }

  clear(): void {
    this.actionLogs = [];
    this.needSnapshots = [];
    this.populationEvents = [];
  }

  get totalEntries(): number {
    return this.actionLogs.length + this.needSnapshots.length + this.populationEvents.length;
  }
}
