import { describe, it, expect } from 'vitest';
import { NeedsComponent } from '../../src/entities/components/Needs';

describe('NeedsComponent', () => {
  it('should initialize all needs to 1.0', () => {
    const needs = new NeedsComponent();
    expect(needs.hunger).toBe(1.0);
    expect(needs.thirst).toBe(1.0);
    expect(needs.energy).toBe(1.0);
    expect(needs.warmth).toBe(1.0);
    expect(needs.safety).toBe(1.0);
    expect(needs.social).toBe(1.0);
  });

  it('should return correct array from toArray', () => {
    const needs = new NeedsComponent();
    needs.hunger = 0.5;
    needs.thirst = 0.6;
    needs.energy = 0.7;
    needs.warmth = 0.8;
    needs.safety = 0.9;
    needs.social = 1.0;
    expect(needs.toArray()).toEqual([0.5, 0.6, 0.7, 0.8, 0.9, 1.0]);
  });

  it('should not be critical when all needs are fine', () => {
    const needs = new NeedsComponent();
    expect(needs.isCritical).toBe(false);
  });

  it('should be critical when a need drops below threshold', () => {
    const needs = new NeedsComponent();
    needs.hunger = 0.1;
    expect(needs.isCritical).toBe(true);
  });

  it('should be critical when any single need is below threshold', () => {
    const needs = new NeedsComponent();
    needs.energy = 0.15;
    expect(needs.isCritical).toBe(true);
  });

  it('should return correct lowest need name', () => {
    const needs = new NeedsComponent();
    needs.hunger = 0.5;
    needs.thirst = 0.3;
    needs.energy = 0.8;
    needs.warmth = 0.9;
    needs.safety = 0.7;
    needs.social = 0.6;
    expect(needs.getLowestNeed()).toBe('thirst');
  });

  it('should return hunger as lowest when it is lowest', () => {
    const needs = new NeedsComponent();
    needs.hunger = 0.1;
    expect(needs.getLowestNeed()).toBe('hunger');
  });

  it('should allow values to be clamped between 0 and 1', () => {
    const needs = new NeedsComponent();
    needs.hunger = Math.max(0, Math.min(1, -0.5));
    needs.thirst = Math.max(0, Math.min(1, 1.5));
    expect(needs.hunger).toBe(0);
    expect(needs.thirst).toBe(1);
  });
});
