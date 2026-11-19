# Evenly 💰

**Evenly** is a modern, intuitive expense tracking and bill splitting application that helps roommates, travel groups, friends, and teams manage shared finances with ease. Create separate groups (e.g. Trips, Flatmates, Weekend Outings, Office Projects), track expenses, split bills fairly, settle balances with minimal transactions, archive historical logs, and export detailed PDF & CSV reports—all through a warm, responsive editorial interface.

---

## ✨ Features

* 🏷️ **Multi-Group Management**: Create and switch between distinct groups (e.g. *Trip & Travel* ✈️, *Home & Roommates* 🏠, *Dining & Outings* 🍕, *Work & Projects* 💼, *Events & Parties* 🎉). Each group maintains its own dedicated member roster, active expenses, and saved history logs.
* 📊 **Visual Analytics Dashboard**: Loads by default with visual representations of logs data: animated spending metrics, multi-segment category progress bars, member contribution shares, settlement flow cards, and past session timelines—with instant group-switching from the header.
* 👥 **Group Member Management**: Add and remove participants per group in the dedicated Split tab.
* ➕ **Multi-Payer Bill Splitting**: Custom payer amounts, equal distribution, or selective group splitting.
* ⚡ **Optimized Debt Settlement**: Greedy debtor-creditor matching algorithm with exact cent arithmetic (zero-drift rounding).
* 📊 **Individual & Grand Total Spent**: Real-time spending breakdown per person within each group.
* 🗂️ **Session Snapshots & History**: Archive settled or active expense sessions per group, filter by group or view all history, search by member/name/date, and restore into the editor.
* 📦 **Custom `.evenly` Backups**: Full export and import of all groups, history, and workspace data into compressed `.evenly` archives. Supports Android OS file-association intents, WhatsApp/email sharing, and manual in-app file restoration with Merge or Replace options.
* 📄 **PDF & CSV Export**: Download beautifully formatted PDF tables or CSV summaries branded with the active group name.
* 📲 **Multi-App Share Log**: One-click sharing dropdown to WhatsApp, Gmail/Email, Telegram, SMS, or System Share. Prepares a formatted "Who Owes What" quick summary and generates the PDF report with executive settlement debt highlights.
* 📱 **Native Android Integration**: Built with Capacitor; saves reports directly to device Documents and integrates with native Android share sheets.
* 🌓 **Automatic Light & Dark Mode**: Seamlessly adapts to your device's display mode (`prefers-color-scheme: dark`) with warm obsidian/charcoal surfaces, crisp typography, and dynamic Android status bar theming. Includes a quick one-tap toggle (Auto / Dark / Light) in the header.
* 🔒 **Offline-First & Auto-Migration**: Fully operational offline with automatic `localStorage` persistence. Automatically migrates legacy roommate storage into a default group without data loss.
* 🎨 **Editorial Design**: Warm digital-notebook aesthetic with subtle paper grain texture and responsive layouts.

---

## 🛠️ Tech Stack

### Web & Frontend
* **Framework**: React 19
* **Bundler**: Vite 8
* **Styling**: Tailwind CSS v4 + Custom Design Tokens (`evenly.css`)
* **Icons**: Lucide React
* **Linter**: Oxlint

### Mobile Platform
* **Runtime**: Capacitor 8 (`@capacitor/android`, `@capacitor/core`)
* **Native Plugins**: `@capacitor/app`, `@capacitor/filesystem`, `@capacitor/share`

### Backup & Export Engines
* **Backup**: JSZip custom `.evenly` archive generator and extractor
* **PDF**: jsPDF + jspdf-autotable
* **CSV**: Native CSV generator with Capacitor Share integration

### Storage
* **Persistence**: Client-side `localStorage` (Offline-first, zero cloud latency)

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v20+ recommended)
* npm (v10+)
* For Android builds: Android Studio & JDK 21

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
```

---

## 🔒 Validation Rules

* Required field validation on descriptions, amounts, and participants.
* Payer sum must strictly balance with total expense amount.
* Positive amounts only with an upper limit of **₹1,00,00,000 (1 Crore)**.
* User-friendly inline validation errors and toast alerts.

---

## 📌 Roadmap

* Multi-currency support (USD, EUR, GBP, etc.)
* Optional cloud synchronization and multi-device collaboration
* Receipt scanning with OCR
* Recurring bill reminders and notifications
* Custom group category colors & avatars

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Abhinav Mamidi**
