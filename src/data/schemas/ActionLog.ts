export interface ActionLogEntry {
  tick: number;
  entityId: number;
  generation: number;
  action: string;
  success: boolean;
  reward: number;
  needsBefore: Record<string, number>;
  needsAfter: Record<string, number>;
}
