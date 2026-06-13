import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalStorageAdapter } from "../../../src/adapters/storage/local-storage-adapter";
import type {
  LunarEvent,
  QuickMemo,
  Person,
} from "../../../src/core/models/types";
import {
  LeapMonthRule,
  RecurrenceRule,
} from "../../../src/core/models/types";

// Minimal in-memory localStorage shim
class MemStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  clear(): void {
    this.data.clear();
  }
  // Quota-exceeded simulation flag
  failNextSet = false;
}

let mem: MemStorage;

beforeEach(() => {
  mem = new MemStorage();
  // Wrap setItem to support quota simulation
  const origSet = mem.setItem.bind(mem);
  mem.setItem = (k: string, v: string) => {
    if ((mem as any).failNextSet) {
      const err: any = new Error("QuotaExceeded");
      err.name = "QuotaExceededError";
      throw err;
    }
    origSet(k, v);
  };
  (globalThis as any).localStorage = mem;
  (globalThis as any).console = console;
});

function event(overrides: Partial<LunarEvent> = {}): LunarEvent {
  return {
    id: "e1",
    name: "Test event",
    lunarDate: { day: 1, month: 1 },
    recurrence: RecurrenceRule.YEARLY,
    leapMonthRule: LeapMonthRule.REGULAR_ONLY,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function memo(overrides: Partial<QuickMemo> = {}): QuickMemo {
  return {
    id: "m1",
    title: "Memo",
    note: "",
    solarDate: { year: 2026, month: 1, day: 1 },
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("LocalStorageAdapter — events", () => {
  it("load returns [] when key missing", () => {
    const a = new LocalStorageAdapter();
    expect(a.load()).toEqual([]);
  });

  it("save then load roundtrips event array", () => {
    const a = new LocalStorageAdapter();
    const evs = [event({ id: "x" }), event({ id: "y" })];
    a.save(evs);
    expect(a.load()).toEqual(evs);
  });

  it("load returns [] on corrupted JSON (warns, no throw)", () => {
    mem.setItem("am-lich-events", "{not json");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const a = new LocalStorageAdapter();
    expect(a.load()).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("load returns [] when stored value is not an array", () => {
    mem.setItem("am-lich-events", JSON.stringify({ not: "array" }));
    expect(new LocalStorageAdapter().load()).toEqual([]);
  });

  it("save throws friendly error on quota exceeded", () => {
    const a = new LocalStorageAdapter();
    (mem as any).failNextSet = true;
    expect(() => a.save([event()])).toThrow(/storage may be full/);
  });
});

describe("LocalStorageAdapter — memos", () => {
  it("loadMemos returns [] when key missing", () => {
    expect(new LocalStorageAdapter().loadMemos()).toEqual([]);
  });

  it("saveMemos + loadMemos roundtrip", () => {
    const a = new LocalStorageAdapter();
    const ms = [memo({ id: "a" }), memo({ id: "b" })];
    a.saveMemos(ms);
    expect(a.loadMemos()).toEqual(ms);
  });

  it("loadMemos returns [] on non-array payload", () => {
    mem.setItem("am-lich-memos", JSON.stringify("oops"));
    expect(new LocalStorageAdapter().loadMemos()).toEqual([]);
  });
});

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: "p1",
    name: "Nguyễn Văn A",
    gender: "male",
    birthDate: { year: 1950, month: 1, day: 1 },
    isDeceased: false,
    deathDate: null,
    treeId: "t1",
    isMarriedIn: false,
    order: 0,
    parentId: null,
    spouseId: null,
    notes: "",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("LocalStorageAdapter — people (gia phả)", () => {
  it("loadPeople returns [] when key missing", () => {
    expect(new LocalStorageAdapter().loadPeople()).toEqual([]);
  });

  it("savePeople + loadPeople roundtrip", () => {
    const a = new LocalStorageAdapter();
    const ps = [person({ id: "a" }), person({ id: "b" })];
    a.savePeople(ps);
    expect(a.loadPeople()).toEqual(ps);
  });

  it("loadPeople returns [] on non-array payload", () => {
    mem.setItem("am-lich-people", JSON.stringify("oops"));
    expect(new LocalStorageAdapter().loadPeople()).toEqual([]);
  });

  it("savePeople throws friendly error on quota exceeded", () => {
    const a = new LocalStorageAdapter();
    (mem as any).failNextSet = true;
    expect(() => a.savePeople([person()])).toThrow(/storage may be full/);
  });
});

describe("LocalStorageAdapter — family trees", () => {
  const fam = {
    id: "f1",
    name: "Họ Nguyễn",
    description: "",
    createdAt: 1,
    updatedAt: 1,
  };

  it("loadFamilyTrees returns [] when key missing", () => {
    expect(new LocalStorageAdapter().loadFamilyTrees()).toEqual([]);
  });

  it("saveFamilyTrees + loadFamilyTrees roundtrip", () => {
    const a = new LocalStorageAdapter();
    a.saveFamilyTrees([fam]);
    expect(a.loadFamilyTrees()).toEqual([fam]);
  });

  it("uses an isolated key from people", () => {
    const a = new LocalStorageAdapter();
    a.savePeople([person({ id: "x" })]);
    a.saveFamilyTrees([fam]);
    expect(a.loadFamilyTrees()).toHaveLength(1);
    expect(a.loadPeople()).toHaveLength(1);
  });
});

describe("LocalStorageAdapter — hidden system event IDs", () => {
  it("loadHiddenSystemEventIds returns [] when key missing", () => {
    expect(new LocalStorageAdapter().loadHiddenSystemEventIds()).toEqual([]);
  });

  it("saveHiddenSystemEventIds + load roundtrips", () => {
    const a = new LocalStorageAdapter();
    a.saveHiddenSystemEventIds(["system:a", "system:b"]);
    expect(a.loadHiddenSystemEventIds()).toEqual(["system:a", "system:b"]);
  });

  it("filters out non-string entries", () => {
    mem.setItem(
      "am-lich-hidden-system-events",
      JSON.stringify(["ok", 42, null, "another"]),
    );
    expect(new LocalStorageAdapter().loadHiddenSystemEventIds()).toEqual([
      "ok",
      "another",
    ]);
  });

  it("storage keys are isolated between events / memos / hidden", () => {
    const a = new LocalStorageAdapter();
    a.save([event({ id: "ev" })]);
    a.saveMemos([memo({ id: "mm" })]);
    a.saveHiddenSystemEventIds(["system:x"]);

    expect(a.load()).toHaveLength(1);
    expect(a.loadMemos()).toHaveLength(1);
    expect(a.loadHiddenSystemEventIds()).toEqual(["system:x"]);
  });
});
