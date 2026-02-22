import { LunarEvent } from '../../core/models/types';

/**
 * Merges imported events with local events deterministically.
 * An imported event overwrites a local event if the imported updatedAt is > local updatedAt.
 * If local is newer or equal, local is kept.
 * Completely new IDs are added.
 */
export function importEvents(
    localEvents: LunarEvent[],
    importedEvents: LunarEvent[]
): LunarEvent[] {
    const localMap = new Map(localEvents.map(e => [e.id, e]));

    for (const imported of importedEvents) {
        const local = localMap.get(imported.id);

        // If it does not exist locally, or imported version is strictly newer, overwrite/add
        if (!local || imported.updatedAt > local.updatedAt) {
            localMap.set(imported.id, imported);
        }
    }

    return Array.from(localMap.values());
}
