# Tab Auto-Closer Firefox Extension

A Firefox extension that automatically closes tabs after a customizable time period.

## Features

- Set custom time intervals for tab auto-closing (minutes or hours)
- Timer resets when you switch to a tab
- Simple and intuitive user interface
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
4. Tabs will automatically close after the specified time period

## Note

- The timer for each tab starts when the tab is created or activated
- The extension will remember your settings between browser sessions
- You can modify the time settings at any time through the popup interface

## Files Structure

- `manifest.json`: Extension configuration
- `popup.html`: User interface for settings
- `popup.js`: Handles user interactions and settings management
- `background.js`: Core logic for tab monitoring and auto-closing
- `icons/`: Extension icons

## License

MIT License
