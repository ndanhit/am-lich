# Quickstart: Lunar Event Manager

## Setup 
Ensure you have Node.js and npm installed.

```bash
git clone <repository>
cd am-lich
npm install
npm run build
```

## Running Tests
Run the test suite to ensure the Core Engine mathematically validates against all 50 years of known lunar-solar alignments, leap-month fallbacks, and offline deterministic behavior. 
*(No UI or server required for this validation).*

```bash
npm run test
```

## Consuming the Library

The core engine is built as pure TS functions.
If a UI is attached later, the core can be wrapped using the provided functions.

Example importing an event:
```typescript
import { importEvents, calculateOccurrencesForYear, LunarEvent } from 'am-lich-core';

// Example existing events on a device
const localEvents: LunarEvent[] = []; 

// Load from a downloaded file (offline)
const importedJson = "..."; 
const imported = JSON.parse(importedJson);

const newLibrary = importEvents(localEvents, imported);

// Get the date specifically for 2026.
const occ = calculateOccurrencesForYear(newLibrary[0], 2026);
```
