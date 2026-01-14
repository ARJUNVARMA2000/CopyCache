// Storage utilities for clipboard history

const STORAGE_KEY = 'clipboardHistory';
const MAX_ENTRIES = 200;

/**
 * Generate a UUID for entry identification
 */
export function generateId() {
  return crypto.randomUUID();
}

/**
 * Detect if content is a URL
 */
export function detectType(content) {
  const urlPattern = /^(https?:\/\/|www\.)[^\s]+$/i;
  return urlPattern.test(content.trim()) ? 'url' : 'text';
}

/**
 * Get all clipboard history entries
 */
export async function getHistory() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

/**
 * Save a new entry to history with deduplication
 */
export async function saveEntry(entry) {
  const history = await getHistory();

  // Deduplicate: skip if content matches most recent entry
  if (history.length > 0 && history[0].content === entry.content) {
    return history;
  }

  // Add new entry at the beginning
  const newEntry = {
    id: generateId(),
    content: entry.content,
    type: entry.type || detectType(entry.content),
    source: entry.source || '',
    timestamp: entry.timestamp || Date.now(),
    pinned: false
  };

  history.unshift(newEntry);

  // Enforce limit while preserving pinned items
  const pinned = history.filter(e => e.pinned);
  const unpinned = history.filter(e => !e.pinned);

  // Keep all pinned + limit unpinned to fill remaining slots
  const maxUnpinned = Math.max(0, MAX_ENTRIES - pinned.length);
  const trimmedUnpinned = unpinned.slice(0, maxUnpinned);

  // Merge back: pinned items stay in their relative positions
  const finalHistory = [];
  let pinnedIdx = 0;
  let unpinnedIdx = 0;

  for (const item of history) {
    if (item.pinned && pinnedIdx < pinned.length) {
      finalHistory.push(pinned[pinnedIdx++]);
    } else if (!item.pinned && unpinnedIdx < trimmedUnpinned.length) {
      finalHistory.push(trimmedUnpinned[unpinnedIdx++]);
    }
    if (finalHistory.length >= MAX_ENTRIES) break;
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: finalHistory });
  return finalHistory;
}

/**
 * Delete an entry by ID
 */
export async function deleteEntry(id) {
  const history = await getHistory();
  const filtered = history.filter(entry => entry.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
  return filtered;
}

/**
 * Toggle pin status for an entry
 */
export async function togglePin(id) {
  const history = await getHistory();
  const entry = history.find(e => e.id === id);

  if (entry) {
    entry.pinned = !entry.pinned;
    await chrome.storage.local.set({ [STORAGE_KEY]: history });
  }

  return history;
}

/**
 * Clear all non-pinned entries
 */
export async function clearHistory() {
  const history = await getHistory();
  const pinned = history.filter(entry => entry.pinned);
  await chrome.storage.local.set({ [STORAGE_KEY]: pinned });
  return pinned;
}

/**
 * Search history by content (case-insensitive substring match)
 */
export function searchHistory(history, query) {
  if (!query || query.trim() === '') {
    return history;
  }

  const lowerQuery = query.toLowerCase();
  return history.filter(entry =>
    entry.content.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter history by type
 */
export function filterByType(history, type) {
  if (!type || type === 'all') {
    return history;
  }
  return history.filter(entry => entry.type === type);
}
