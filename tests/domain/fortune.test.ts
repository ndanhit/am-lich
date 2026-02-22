import { describe, it, expect } from 'vitest';
import { convertSolarToLunar } from '../../src/core/lunar-math/converter';

describe('Fortune Data Extraction', () => {
    it('should extract correct fortune data for 2026-02-22', () => {
        const result = convertSolarToLunar(2026, 2, 22);
        expect(result).not.toBeNull();
        if (result) {
            expect(result.lunarDay).toBe(6);
            expect(result.lunarMonth).toBe(1);
            expect(result.canChiDay).toBe('Đinh Mão');
            expect(result.canChiMonth).toBe('Canh Dần');
            expect(result.fateElement).toBe('Lô Trung Hỏa');
            expect(result.auspiciousHours).toContain('Tý');
            expect(result.incompatibleAges).toBeDefined();
        }
    });
});
