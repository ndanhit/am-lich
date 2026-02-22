import { LunarYear, Lunar, Solar, requiredMinYear, requiredMaxYear } from 'lunar-javascript';
import { LunarDate, SolarDate, LunarDateContext, MIN_YEAR, MAX_YEAR } from '../models/types';
import { translateGanZhiToVietnamese } from '../models/can-chi';

const lunarYearCache = new Map<number, any>();

/**
 * Validates if the given day and month are structurally possible 
 * in the specific lunar year permutations (e.g. month has 29 or 30 days).
 */
export function isValidLunarDate(year: number, month: number, day: number, isLeap: boolean): boolean {
    if (year < requiredMinYear || year > requiredMaxYear) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 30) return false;

    try {
        let lunarYear = lunarYearCache.get(year);
        if (!lunarYear) {
            lunarYear = LunarYear.fromYear(year);
            lunarYearCache.set(year, lunarYear);
        }
        // getMonth natively accepts negative numbers for leap months
        const targetMonth = isLeap ? -month : month;
        const lunarMonth = lunarYear.getMonth(targetMonth);

        if (!lunarMonth) {
            return false; // Month does not exist (e.g., Leap Month 5 in a year with no leap month 5)
        }

        if (day > lunarMonth.getDayCount()) {
            return false; // Day exceeds the length of this specific month
        }

        return true;
    } catch (error) {
        return false;
    }
}

const solarCache = new Map<string, SolarDate | null>();

/**
 * Calculates a Solar Gregorian date from a Lunar date specification for a target year.
 * Returns null if the specific date combination doesn't exist in that year 
 * (e.g. requesting a leap month that isn't a leap month that year)
 */
export function convertLunarToSolar(
    targetYear: number,
    lunarDate: LunarDate,
    isLeapMonthEntry: boolean
): SolarDate | null {
    const cacheKey = `${targetYear}-${lunarDate.month}-${lunarDate.day}-${isLeapMonthEntry}`;
    if (solarCache.has(cacheKey)) {
        return solarCache.get(cacheKey)!;
    }

    try {
        // lunar-javascript expects month to be negative if it's a leap month
        const targetMonth = isLeapMonthEntry ? -lunarDate.month : lunarDate.month;

        // First, check if this specific date is valid for this year
        if (!isValidLunarDate(targetYear, Math.abs(targetMonth), lunarDate.day, isLeapMonthEntry)) {
            solarCache.set(cacheKey, null);
            return null; // Date doesn't exist (e.g. Day 30 in a 29-day month, or Leap Month 5 in a year with no leap month)
        }

        const lunar = Lunar.fromYmd(targetYear, targetMonth, lunarDate.day);
        const solar = lunar.getSolar();

        const result = {
            year: solar.getYear(),
            month: solar.getMonth(),
            day: solar.getDay(),
        };

        solarCache.set(cacheKey, result);
        return result;
    } catch (err) {
        // Math bounds exceeded or invalid input
        solarCache.set(cacheKey, null);
        return null;
    }
}
const solarToLunarCache = new Map<string, LunarDateContext | null>();

/**
 * Converts a Solar Gregorian date to a Lunar date context.
 * Includes Vietnamese Can Chi names and leap month indicators.
 */
export function convertSolarToLunar(year: number, month: number, day: number): LunarDateContext | null {
    if (year < MIN_YEAR || year > MAX_YEAR) return null;

    const cacheKey = `${year}-${month}-${day}`;
    if (solarToLunarCache.has(cacheKey)) {
        return solarToLunarCache.get(cacheKey)!;
    }

    try {
        const solar = Solar.fromYmd(year, month, day);
        const lunar = solar.getLunar();

        const result: LunarDateContext = {
            lunarDay: lunar.getDay(),
            lunarMonth: lunar.getMonth(),
            lunarYear: lunar.getYear(),
            isLeapMonth: lunar.getMonth() < 0,
            canChiYear: translateGanZhiToVietnamese(lunar.getYearInGanZhi())
        };

        solarToLunarCache.set(cacheKey, result);
        return result;
    } catch (err) {
        solarToLunarCache.set(cacheKey, null);
        return null;
    }
}
