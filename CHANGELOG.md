# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-01-24
### Fixed
- Tabs now properly close after system sleep/standby
- Fixed timer accuracy when computer goes to sleep

### Changed
- Improved timer mechanism to use timestamps instead of setTimeout
- Added periodic checks to ensure consistent tab management

## [1.0.0] - 2024-01-24
### Added
- Initial release
- Customizable time intervals for tab auto-closing
- Support for minutes and hours
- Countdown only starts when tabs become inactive
- Timer pauses when switching to a tab
- Pinned tabs are never closed
- Persistent settings across browser sessions
