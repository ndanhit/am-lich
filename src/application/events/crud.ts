import { LunarEvent } from '../../core/models/types';

export function addEvent(events: LunarEvent[], newEvent: LunarEvent): LunarEvent[] {
    if (events.some(e => e.id === newEvent.id)) {
        throw new Error(`Event with ID ${newEvent.id} already exists.`);
    }
    return [...events, newEvent];
}

export function updateEvent(events: LunarEvent[], updatedEvent: LunarEvent): LunarEvent[] {
    const exists = events.some(e => e.id === updatedEvent.id);
    if (!exists) {
        throw new Error(`Event with ID ${updatedEvent.id} not found.`);
    }

    return events.map(event =>
        event.id === updatedEvent.id ? { ...updatedEvent } : event
    );
}

export function removeEvent(events: LunarEvent[], idToRemove: string): LunarEvent[] {
    return events.filter(event => event.id !== idToRemove);
}
