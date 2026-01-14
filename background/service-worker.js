// Background service worker: Message handling and storage operations

import { saveEntry, deleteEntry, togglePin, clearHistory, getHistory } from '../lib/storage.js';

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch(error => {
      console.error('Message handling error:', error);
      sendResponse({ error: error.message });
    });

  // Return true to indicate async response
  return true;
});

/**
 * Process incoming messages
 */
async function handleMessage(message) {
  switch (message.type) {
    case 'SAVE_ENTRY':
      return await saveEntry(message.payload);

    case 'DELETE_ENTRY':
      return await deleteEntry(message.payload.id);

    case 'TOGGLE_PIN':
      return await togglePin(message.payload.id);

    case 'CLEAR_HISTORY':
      return await clearHistory();

    case 'GET_HISTORY':
      return await getHistory();

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}
