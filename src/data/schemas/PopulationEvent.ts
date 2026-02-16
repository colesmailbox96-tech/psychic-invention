export type PopulationEventType = 'birth' | 'death' | 'milestone';

export interface PopulationEvent {
  tick: number;
  type: PopulationEventType;
  entityId?: number;
  details: Record<string, any>;
}
