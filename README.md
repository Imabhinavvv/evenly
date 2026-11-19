# Evenly

**Evenly** is a fast, 100% offline-first expense tracker and bill splitting application designed for roommates, travel groups, friends, and teams. Built with React 19, Vite, Tailwind CSS, and Capacitor 8, Evenly combines a warm editorial aesthetic with powerful local computation: multi-group management, exact-cent debt minimization, on-device OCR receipt scanning, air-gapped QR code peer transfer, and full workspace backup archiving—with zero cloud dependencies and complete privacy.

---

## Features

### Multi-Group Workspace Architecture
* **Isolated Group Contexts**: Create dedicated groups categorized by type (Trips & Travel, Home & Flatmates, Dining & Outings, Projects & Work, Events).
* **Dedicated Data Isolation**: Each group maintains its own member roster, active expenses, and saved session history.
* **Unified Layout**: Clean single-container layout with hairline section dividers for member rosters, expense entry, debt calculation, expense log, and total spent tally.
* **Streamlined Group Creation**: Unified single-field initial member input with inline `+` action button.

### Offline-First On-Device OCR Receipt Scanner
* **100% On-Device Processing**: Powered by `@capacitor-mlkit/text-recognition` (Google ML Kit on Android, Apple Vision on iOS). No images or text ever leave your device.
* **Bundled Model Assets**: ML Kit vision dependencies are declared in the native Android manifest to bundle models at install time, avoiding runtime download failures when offline.
* **Spatial Block & Multi-Column Parser**: Custom line-pairing heuristics match right-aligned price values with itemized descriptions and filter out thermal receipt noise and tax sub-lines.
* **Minimalistic Scanned Toast**: Sleek, auto-dismissing 2-second notification replacing intrusive scan banners.
* **Native Mobile Gated**: The receipt scanner automatically activates only on native Android and iOS builds, preserving clean desktop and browser compatibility.

### Offline Peer-to-Peer Log Sharing & Air-Gapped QR Transfer
* **Single-Log `.evenly` Archive Export**: Export individual session logs as lightweight `.evenly` files via native share sheets (Quick Share, AirDrop, Bluetooth, Drive, or Files) without exposing your entire multi-group database.
* **Air-Gapped QR Code Transfer**: High-density indexed tuple serialization encodes logs with up to 15–20 expenses into ~200 characters for instant peer-to-peer scanning without network connectivity.
* **Settled Status Preservation**: Encodes and preserves calculation settlement status (`Settled` vs `Pending`) across QR codes and single-log files, so imported logs are accurately recognized.
* **In-App Camera QR Scanner**: Built-in camera viewfinder with responsive reticle guide corners, throttled scan loop (~10 fps to save CPU/battery), haptic feedback, and a fallback to upload QR screenshots from photos.
* **Import Log Modal**: Recipients can choose whether to open the shared log as a safe isolated group, load it directly into the active editor, or save it straight to history with status verification badges.
* **Unslopped Portal Share Popover**: Clean, minimal popover without verbose subtitles, rendered into document root via React portals with dynamic viewport bounding to eliminate X/Y-axis clipping on all screen sizes.

### Material You & Adaptive App Icons
* **Consistent Brand Experience**: Consistent `#FFFFFF` icon background across light and dark display modes without disruptive theme-switching.
* **Material You Themed Icons**: Native Android 13+ `<monochrome>` layer support in adaptive icons (`ic_launcher.xml` and `ic_launcher_round.xml`) allowing launcher wallpaper tinting when dynamic theming is enabled.
* **Comprehensive Multi-Density Assets**: Full mipmap sets across `ldpi`, `mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, and `xxxhdpi` standardized strictly on clean PNGs, avoiding AAPT duplicate collisions.
* **Web & PWA Icons**: Complete icon suite from 48px to 512px in `public/icons/`, multi-resolution `favicon.ico`, and scalable `favicon.svg`.

### Smart Debt Settlement Engine
* **Greedy Settlement Algorithm**: Calculates the minimum number of transactions required to balance all accounts.
* **Exact-Cent Arithmetic**: Eliminates floating-point rounding errors and balance drift.
* **Multi-Payer Support**: Split individual expenses equally, specify custom payer amounts, or select individual members.

### Multi-Currency Engine
* Supports 10 global currencies: **INR (₹)**, **USD ($)**, **EUR (€)**, **GBP (£)**, **JPY (¥)**, **CAD (C$)**, **AUD (A$)**, **AED**, **SGD (S$)**, and **CHF**.
* Live currency selection in Settings that reactively updates balance sheets, settlement transfers, expense logs, and report exports.

### Native Mobile & Gesture Navigation
* **Hardware Back Button Handling**: State-aware priority cascade for Android back button and swipe navigation:
  1. Dismisses confirmation dialogs, QR scanner, or import modals.
  2. Closes restore and session save dialogs.
  3. Dismisses settings sheet and history pages.
  4. Cancels active expense editing mode.
  5. Navigates back to the Dashboard tab.
  6. Gracefully exits to the Android home screen when at the root dashboard.

### Privacy, Backups & Export
* **No Third-Party Trackers**: Zero telemetry, analytics, or third-party cookies for full Google Play Store data privacy compliance.
* **Full Workspace Backups**: Export or restore all groups, expenses, and history into compressed `.evenly` zip archives.
* **OS File Associations**: Registers `.evenly` file type intent filters in Android so tapping a backup file in any file manager or messaging app launches Evenly automatically.
* **PDF & CSV Reports**: Export clean, branded reports and itemized spreadsheets directly to device storage.

---

## Tech Stack

### Web & Frontend
* **Framework**: React 19
* **Bundler**: Vite 8
* **Styling**: Tailwind CSS v4 + Custom Design Tokens (`evenly.css`)
* **Icons**: Lucide React & React Icons
* **Linter**: Oxlint

### Mobile Platform & Native Plugins
* **Package Name / Application ID**: `com.algorithmaliens.evenly`
* **Runtime**: Capacitor 8 (`@capacitor/android`, `@capacitor/core`)
* **Target SDK**: Android 16 (API Level 36) / Minimum SDK: Android 7.0 (API Level 24)
* **Plugins**:
  * `@capacitor/app`: App lifecycle and hardware back button handling
  * `@capacitor/camera`: Camera and photo gallery capture
  * `@capacitor-mlkit/text-recognition`: On-device text recognition (Google ML Kit)
  * `@capacitor/filesystem`: Internal cache and document storage
  * `@capacitor/share`: Native OS share sheet integration

### Offline Engines
* **Backup & Compression**: JSZip
* **QR Generation & Scanning**: `qrcode`, `jsqr`
* **PDF Export**: jsPDF + jspdf-autotable
* **Persistence**: Client-side `localStorage` (100% offline, zero server requirement)

---

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v20+ recommended)
* npm (v10+)
* For Android builds: Android Studio & JDK 21 (API Level 36 / Android 16 target)

### Installation

```bash
# Clone the repository
git clone https://github.com/Imabhinavvv/evenly.git
cd evenly

# Install dependencies
npm install
```

### Running Locally

```bash
# Start Vite development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build
```

### Building for Android

```bash
# Build web assets and sync to native Android project
npm run build
npx cap sync android

# Open Android project in Android Studio
npx cap open android

# Or build debug APK directly via Gradle
cd android
./gradlew assembleDebug
```

---

## Roadmap

- [x] Multi-currency engine (10 global currencies)
- [x] Offline on-device OCR receipt scanning (Google ML Kit)
- [x] Offline peer-to-peer log sharing (`.evenly` file export & air-gapped QR transfer)
- [x] Material You dynamic themed icons & adaptive launcher icons
- [x] Android hardware back gesture navigation cascade
- [x] Android API 36 / Google Play Store compliance (zero third-party tracking)
- [x] Unified package namespace: `com.algorithmaliens.evenly`
- [ ] Recurring expense reminders and scheduled notifications
- [ ] Custom group category colors and avatars

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Team

* **Abhinav Mamidi** — [abhinavmamidi.mails@gmail.com](mailto:abhinavmamidi.mails@gmail.com)
* **Thanmay Sadguru Musa** — [thanmaysadguru.mails@gmail.com](mailto:thanmaysadguru.mails@gmail.com)
