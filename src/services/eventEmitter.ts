// src/services/eventEmitter.ts (UPDATED)
type EventListener = (...args: any[]) => void;

class EventEmitterClass {
  private events: { [key: string]: EventListener[] } = {};

  on(event: string, listener: EventListener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);

    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter((l) => l !== listener);
    };
  }

  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach((listener) => listener(...args));
    }
  }

  off(event: string, listener: EventListener) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((l) => l !== listener);
    }
  }
}

export const EventEmitter = new EventEmitterClass();

export const Events = {
  MEDAL_UNLOCKED: 'MEDAL_UNLOCKED',
  STREAK_UPDATED: 'STREAK_UPDATED',
  STREAK_LOST: 'STREAK_LOST', // 🆕 ДОДАДЕНО
};