import { describe, it, expect } from 'vitest';
import { addEvent, updateEvent, removeEvent } from '../../src/application/events/crud';
import { LunarEvent, LeapMonthRule } from '../../src/core/models/types';

describe('Offline CRUD Mechanisms', () => {
    const mockEvent1: LunarEvent = {
        id: 'evt-1',
        name: 'Grandpa Memorial',
        lunarDate: { day: 15, month: 7 },
        leapMonthRule: LeapMonthRule.REGULAR_ONLY,
        createdAt: 1000,
        updatedAt: 1000
    };

    const mockEvent2: LunarEvent = {
        id: 'evt-2',
        name: 'Lunar New Year',
        lunarDate: { day: 1, month: 1 },
        leapMonthRule: LeapMonthRule.REGULAR_ONLY,
        createdAt: 2000,
        updatedAt: 2000
    };

    it('should add a new event to a collection immutably', () => {
        const initialState: LunarEvent[] = [mockEvent1];
        const nextState = addEvent(initialState, mockEvent2);

        expect(nextState).toHaveLength(2);
        expect(nextState[1]).toEqual(mockEvent2);
        expect(initialState).toHaveLength(1); // Original array mutability check
    });

    it('should throw an error or reject adding an event with an existing ID', () => {
        const initialState: LunarEvent[] = [mockEvent1];
        expect(() => addEvent(initialState, mockEvent1)).toThrow();
    });

    it('should update an event immutably', () => {
        const initialState: LunarEvent[] = [mockEvent1, mockEvent2];
        const updatedEvent1: LunarEvent = {
            ...mockEvent1,
            name: 'Grandpa Memorial (Updated)',
            updatedAt: 3000
        };

        const nextState = updateEvent(initialState, updatedEvent1);

        expect(nextState).toHaveLength(2);
        expect(nextState.find(e => e.id === 'evt-1')?.name).toBe('Grandpa Memorial (Updated)');
        expect(initialState.find(e => e.id === 'evt-1')?.name).toBe('Grandpa Memorial');
    });

    it('should throw when updating a non-existent event', () => {
        const initialState: LunarEvent[] = [mockEvent1];
        expect(() => updateEvent(initialState, mockEvent2)).toThrow();
    });

    it('should remove an event immutably', () => {
        const initialState: LunarEvent[] = [mockEvent1, mockEvent2];
        const nextState = removeEvent(initialState, 'evt-1');

        expect(nextState).toHaveLength(1);
        expect(nextState[0].id).toBe('evt-2');
        expect(initialState).toHaveLength(2);
    });
});
