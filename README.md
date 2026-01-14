# CopyCache

A Chrome extension to save and search your clipboard history with ease.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)

## Features

- 📋 **Automatic Clipboard Tracking** - Automatically saves everything you copy
- 🔍 **Search** - Quickly find past clipboard entries
- 🏷️ **Filters** - Filter by type (Text, URL, All)
- 📌 **Pin Items** - Keep important entries at the top
- ⌨️ **Keyboard Shortcuts** - Navigate and manage with keyboard
- 🎨 **Clean UI** - Modern, minimal interface

## Installation

### From Source (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/ARJUNVARMA2000/CopyCache.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top right)

4. Click **Load unpacked** and select the cloned folder

5. The extension icon will appear in your toolbar

## Usage

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+V` (Win) / `Cmd+Shift+V` (Mac) | Open CopyCache popup |
| `↑` `↓` | Navigate through entries |
| `Enter` | Copy selected entry |
| `Delete` | Remove selected entry |

### Features

- **Search**: Type in the search box to filter entries
- **Filter**: Click filter buttons to show All, Text, or URLs only
- **Pin**: Click the pin icon to keep important items at the top
- **Clear**: Use the "Clear All" button to remove all history

## Project Structure

```
CopyCache/
├── manifest.json        # Extension configuration
├── background/
│   └── service-worker.js   # Background clipboard monitoring
├── content/
│   └── content.js       # Content script for page interaction
├── popup/
│   ├── popup.html       # Popup UI structure
│   ├── popup.css        # Popup styles
│   └── popup.js         # Popup logic
├── lib/
│   └── storage.js       # Chrome storage utilities
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Permissions

- `clipboardRead` - Read clipboard contents
- `storage` - Store clipboard history locally
- `activeTab` - Access current tab for clipboard operations

## License

MIT License - feel free to use and modify!

---

Made with ❤️ by [Arjun Varma](https://github.com/ARJUNVARMA2000)
