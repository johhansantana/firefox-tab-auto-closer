# Tab Auto-Closer Firefox Extension

A Firefox extension that automatically closes inactive tabs after a customizable time period.

## Features

- Set custom time intervals for tab auto-closing (minutes or hours)
- Countdown only starts when tabs become inactive (not being viewed)
- Timer pauses when you switch to a tab
- Pinned tabs are never closed
- Persistent settings across browser sessions

## Installation

1. Open Firefox and go to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on"
4. Navigate to the extension directory and select `manifest.json`

## Development

To modify or enhance the extension:

1. Clone this repository
2. Make your changes
3. Test the extension using the installation steps above
4. Package the extension for distribution (optional)

## Usage

1. Click the extension icon in the toolbar
2. Set your desired time interval (in minutes or hours)
3. Click "Save Settings"
4. Tabs will automatically close after being inactive for the specified time period

## Note

- The countdown only starts when a tab becomes inactive (when you switch away from it)
- The timer pauses when you switch back to a tab
- Pinned tabs are completely ignored by the extension
- You can pin important tabs to prevent them from being closed
- The extension will remember your settings between browser sessions

## Files Structure

- `manifest.json`: Extension configuration
- `popup.html`: User interface for settings
- `popup.js`: Handles user interactions and settings management
- `background.js`: Core logic for tab monitoring and auto-closing
- `icons/`: Extension icons

## License

MIT License
