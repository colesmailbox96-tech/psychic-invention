import { Component } from '../../core/ECS';

export interface InventoryItem {
  resourceType: string;
  quantity: number;
}

export class InventoryComponent implements Component {
  type = 'inventory';
  items: InventoryItem[];
  maxSlots: number;

  constructor(maxSlots = 10) {
    this.items = [];
    this.maxSlots = maxSlots;
  }

  addItem(resourceType: string, quantity = 1): boolean {
    const existing = this.items.find(i => i.resourceType === resourceType);
    if (existing) {
      existing.quantity += quantity;
      return true;
    }
    if (this.isFull) return false;
    this.items.push({ resourceType, quantity });
    return true;
  }

  removeItem(resourceType: string, quantity = 1): boolean {
    const existing = this.items.find(i => i.resourceType === resourceType);
    if (!existing || existing.quantity < quantity) return false;
    existing.quantity -= quantity;
    if (existing.quantity <= 0) {
      this.items = this.items.filter(i => i.resourceType !== resourceType);
    }
    return true;
  }

  getQuantity(resourceType: string): number {
    const existing = this.items.find(i => i.resourceType === resourceType);
    return existing ? existing.quantity : 0;
  }

  hasItem(resourceType: string, quantity = 1): boolean {
    return this.getQuantity(resourceType) >= quantity;
  }

  get isFull(): boolean {
    return this.items.length >= this.maxSlots;
  }

  get usedSlots(): number {
    return this.items.length;
  }

  get totalItems(): number {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }
}
