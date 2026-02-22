# Contract: Core Engine Expansion

## Solar to Lunar Conversion

The Core Engine will expose a new conversion utility.

### `convertSolarToLunar`

**Signature**:
```typescript
function convertSolarToLunar(year: number, month: number, day: number): LunarDateContext;
```

**Output Structure**:
```typescript
interface LunarDateContext {
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  isLeapMonth: boolean;
  canChiYear: string; // Vietnamese name mapped from static table
}
```

**Behavior**:
- Deterministic output based on `lunar-javascript` library.
- Throws error or returns null if input solar date is outside supported range (1901-2099).
- Uses static Vietnamese Can Chi name mapping (60-entry cycle).
