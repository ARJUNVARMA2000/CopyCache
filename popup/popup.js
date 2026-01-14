// Popup UI logic

import { searchHistory, filterByType } from '../lib/storage.js';

// DOM Elements
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');
const pinnedSection = document.getElementById('pinned-section');
const pinnedHeader = document.getElementById('pinned-header');
const pinnedList = document.getElementById('pinned-list');
const recentList = document.getElementById('recent-list');
const emptyState = document.getElementById('empty-state');
const clearBtn = document.getElementById('clear-btn');

// State
let allEntries = [];
let filteredEntries = [];
let selectedIndex = -1;
let currentFilter = 'all';

// Initialize popup
async function init() {
  await loadHistory();
  setupEventListeners();
  searchInput.focus();
}

// Load history from background
async function loadHistory() {
  try {
    allEntries = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });
    applyFilters();
  } catch (error) {
    console.error('Failed to load history:', error);
    allEntries = [];
    applyFilters();
  }
}

// Apply search and type filters
function applyFilters() {
  const query = searchInput.value;
  let entries = searchHistory(allEntries, query);
  entries = filterByType(entries, currentFilter);
  filteredEntries = entries;
  selectedIndex = -1;
  render();
}

// Render the UI
function render() {
  const pinned = filteredEntries.filter(e => e.pinned);
  const recent = filteredEntries.filter(e => !e.pinned);

  // Update pinned section visibility
  if (pinned.length > 0) {
    pinnedSection.classList.remove('hidden');
    pinnedList.innerHTML = pinned.map((entry, idx) => createEntryCard(entry, idx)).join('');
  } else {
    pinnedSection.classList.add('hidden');
    pinnedList.innerHTML = '';
  }

  // Update recent list
  recentList.innerHTML = recent.map((entry, idx) =>
    createEntryCard(entry, pinned.length + idx)
  ).join('');

  // Show/hide empty state
  if (filteredEntries.length === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
  }

  // Update selection
  updateSelection();
}

// Create entry card HTML
function createEntryCard(entry, index) {
  const truncatedContent = entry.content.length > 150
    ? entry.content.substring(0, 150) + '...'
    : entry.content;

  const timeAgo = formatTimeAgo(entry.timestamp);

  return `
    <div class="entry-card ${entry.pinned ? 'pinned' : ''}" data-id="${entry.id}" data-index="${index}">
      <div class="entry-content">
        <div class="entry-text">${escapeHtml(truncatedContent)}</div>
        <div class="entry-meta">
          <span class="entry-type ${entry.type}">${entry.type}</span>
          <span class="entry-time">${timeAgo}</span>
        </div>
      </div>
      <div class="entry-actions">
        <button class="action-btn pin-btn ${entry.pinned ? 'pinned' : ''}" data-action="pin" title="${entry.pinned ? 'Unpin' : 'Pin'}">
          <svg viewBox="0 0 24 24" fill="${entry.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
          </svg>
        </button>
        <button class="action-btn delete-btn" data-action="delete" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}

// Format relative time
function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Update visual selection
function updateSelection() {
  const cards = document.querySelectorAll('.entry-card');
  cards.forEach((card, idx) => {
    if (idx === selectedIndex) {
      card.classList.add('selected');
      card.scrollIntoView({ block: 'nearest' });
    } else {
      card.classList.remove('selected');
    }
  });
}

// Copy entry to clipboard
async function copyEntry(entry) {
  try {
    await navigator.clipboard.writeText(entry.content);
    showToast('Copied to clipboard');
  } catch (error) {
    console.error('Failed to copy:', error);
    showToast('Failed to copy');
  }
}

// Show toast notification
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 1500);
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  searchInput.addEventListener('input', () => {
    applyFilters();
  });

  // Filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  // Pinned section toggle
  pinnedHeader.addEventListener('click', () => {
    pinnedSection.classList.toggle('collapsed');
  });

  // Clear button
  clearBtn.addEventListener('click', async () => {
    if (confirm('Clear all non-pinned entries?')) {
      await chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' });
      await loadHistory();
    }
  });

  // Entry card clicks
  document.addEventListener('click', async (e) => {
    const card = e.target.closest('.entry-card');
    const actionBtn = e.target.closest('.action-btn');

    if (actionBtn && card) {
      e.stopPropagation();
      const id = card.dataset.id;
      const action = actionBtn.dataset.action;

      if (action === 'pin') {
        await chrome.runtime.sendMessage({ type: 'TOGGLE_PIN', payload: { id } });
        await loadHistory();
      } else if (action === 'delete') {
        await chrome.runtime.sendMessage({ type: 'DELETE_ENTRY', payload: { id } });
        await loadHistory();
      }
    } else if (card) {
      const entry = filteredEntries.find(e => e.id === card.dataset.id);
      if (entry) {
        await copyEntry(entry);
      }
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', async (e) => {
    const cards = document.querySelectorAll('.entry-card');
    const maxIndex = cards.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, maxIndex);
        updateSelection();
        break;

      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelection();
        break;

      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex <= maxIndex) {
          e.preventDefault();
          const card = cards[selectedIndex];
          const entry = filteredEntries.find(e => e.id === card.dataset.id);
          if (entry) {
            await copyEntry(entry);
          }
        }
        break;

      case 'Delete':
      case 'Backspace':
        if (selectedIndex >= 0 && selectedIndex <= maxIndex && document.activeElement !== searchInput) {
          e.preventDefault();
          const card = cards[selectedIndex];
          const id = card.dataset.id;
          await chrome.runtime.sendMessage({ type: 'DELETE_ENTRY', payload: { id } });
          await loadHistory();
        }
        break;

      case 'Escape':
        window.close();
        break;
    }
  });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', init);
