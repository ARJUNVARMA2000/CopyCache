// Settings management utilities

const SETTINGS_KEY = 'copyCacheSettings';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  blacklist: [],
  mergeEnabled: true,
  maxImageSize: 500 * 1024, // 500KB
  shortcuts: {
    openPopup: { key: 'V', modifiers: ['ctrl', 'shift'] }
  }
};

/**
 * Get all settings
 */
export async function getSettings() {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
}

/**
 * Save settings
 */
export async function saveSettings(settings) {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await chrome.storage.local.set({ [SETTINGS_KEY]: updated });
  return updated;
}

/**
 * Reset settings to defaults
 */
export async function resetSettings() {
  await chrome.storage.local.set({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
  return DEFAULT_SETTINGS;
}

/**
 * Get theme preference
 */
export async function getTheme() {
  const settings = await getSettings();
  return settings.theme;
}

/**
 * Set theme preference
 */
export async function setTheme(theme) {
  return await saveSettings({ theme });
}

/**
 * Get blacklist
 */
export async function getBlacklist() {
  const settings = await getSettings();
  return settings.blacklist;
}

/**
 * Add site to blacklist
 */
export async function addToBlacklist(pattern) {
  const settings = await getSettings();
  if (!settings.blacklist.includes(pattern)) {
    settings.blacklist.push(pattern);
    await saveSettings({ blacklist: settings.blacklist });
  }
  return settings.blacklist;
}

/**
 * Remove site from blacklist
 */
export async function removeFromBlacklist(pattern) {
  const settings = await getSettings();
  settings.blacklist = settings.blacklist.filter(p => p !== pattern);
  await saveSettings({ blacklist: settings.blacklist });
  return settings.blacklist;
}

/**
 * Check if URL is blacklisted
 * Supports patterns: exact domain, *.domain.com, domain.*
 */
export function isBlacklisted(url, blacklist) {
  if (!blacklist || blacklist.length === 0) return false;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    return blacklist.some(pattern => {
      // Exact match
      if (pattern === hostname) return true;

      // Wildcard patterns
      if (pattern.startsWith('*.')) {
        // *.example.com matches sub.example.com and example.com
        const domain = pattern.slice(2);
        return hostname === domain || hostname.endsWith('.' + domain);
      }

      if (pattern.endsWith('.*')) {
        // bank.* matches bank.com, bank.co.uk, etc.
        const prefix = pattern.slice(0, -2);
        return hostname.startsWith(prefix + '.');
      }

      // Partial match (contains)
      return hostname.includes(pattern);
    });
  } catch {
    return false;
  }
}

/**
 * Check if merge duplicates is enabled
 */
export async function isMergeEnabled() {
  const settings = await getSettings();
  return settings.mergeEnabled;
}

/**
 * Toggle merge duplicates setting
 */
export async function setMergeEnabled(enabled) {
  return await saveSettings({ mergeEnabled: enabled });
}
