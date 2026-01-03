# Changelog

## [2.0.0] - 2026-01-03

### ✨ New Features

- **Tab System**: Implemented browser-style tab management with per-tab state for data, queries, and loading. Added keyboard shortcuts for tab control (`Cmd/Ctrl+W` to close, middle-click to close).
- **Pack Browsing**: Click on pack artwork to open a dedicated tab showing all samples from that pack.
- **Keyboard Shortcuts**: Comprehensive global keyboard shortcuts for:
  - Audio playback and navigation (Space, Enter, Escape, R)
  - Seeking (Left/Right arrows)
  - Volume control (M for mute, `[` and `]` for volume)
  - Sample navigation (Up/Down arrows, Home/End)
- **Audio Pre-fetching**: Smart pre-fetch queue for audio samples with visible samples prioritized.
- **Cache Indicator**: Visual indicator showing which samples are pre-fetched vs. not yet loaded.
- **Drag & Drop Improvements**:
  - Drag icon caching and offset generation for better visual feedback.
  - Audio pauses automatically after successful drag completion.
  - Loading state indicator for dragged samples.
- **Display Names**: Improved sample name formatting to show readable names with tempo and pack info.
- **Genre Selection**: New genre select component with search functionality and normalized label matching.
- **UI Redesign**: Sort and asset category selection redesigned as button groups with icons.

### 🔧 Improvements

- **Performance**: Centralized audio sample descrambling and decoding logic for better efficiency.
- **Tag Management**: Refactored genre selection and tag management into store; filters out 'Genre' tags from summary display.
- **Search Input**: Updated text selection behavior and simplified autocomplete suggestion display.
- **Audio Player**: Refined volume slider styling.

### 🏗️ Infrastructure

- Project renamed from Splicerr to **Splice-Tab**.
- Updated package version to 2.0.0.
- Added platform-specific build scripts for macOS and Windows.
- Synced CI configuration and updated release workflow.
- Updated dependencies and improved lockfile management.

---

_This changelog covers all changes from commit `bb36f389` to the current release._
