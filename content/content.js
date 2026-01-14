// Content script: Captures copy events and sends to background worker

/**
 * Detect if content is a URL
 */
function detectType(content) {
  const urlPattern = /^(https?:\/\/|www\.)[^\s]+$/i;
  return urlPattern.test(content.trim()) ? 'url' : 'text';
}

/**
 * Handle copy events
 */
function handleCopy(event) {
  let content = '';

  // Try to get content from clipboard data first
  if (event.clipboardData) {
    content = event.clipboardData.getData('text/plain');
  }

  // Fallback to window selection
  if (!content) {
    const selection = window.getSelection();
    if (selection) {
      content = selection.toString();
    }
  }

  // Skip empty content
  if (!content || content.trim() === '') {
    return;
  }

  // Send to background worker
  chrome.runtime.sendMessage({
    type: 'SAVE_ENTRY',
    payload: {
      content: content,
      type: detectType(content),
      source: window.location.href,
      timestamp: Date.now()
    }
  }).catch(() => {
    // Ignore errors (e.g., extension context invalidated)
  });
}

// Listen for copy events
document.addEventListener('copy', handleCopy, true);
