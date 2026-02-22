# Âm Lịch — Vietnamese Lunar Calendar & Event Manager

A modern, fast, and privacy-focused Vietnamese Lunar Calendar application. Built with TypeScript and zero UI dependencies for maximum performance and a beautiful, custom aesthetic.

## ✨ Features

- **Precise Lunar Conversion**: High-accuracy conversion between Solar and Lunar dates using the latest astronomical formulas.
- **Day Detail Modal**: Deep dive into any day with detailed information:
  - **Traditional Fortune**: View Fate elements, Auspicious hours (Giờ hoàng đạo), and Incompatible ages (Tuổi xung).
  - **Can Chi**: Traditional Vietnamese time-keeping (Ngày, Tháng, Năm).
- **Event Management**:
  - Add recurring events based on the Lunar calendar (e.g., anniversaries, festivals).
  - Automatic leap month rule handling (Chỉ tháng thường, Chỉ tháng nhuận, or Cả hai).
- **Modern UI/UX**:
  - **Dark Mode Support**: Full theme integration that respects system preferences.
  - **Liquid Layout**: Mobile-first responsive design featuring a sleek "Bottom Sheet" on small screens.
  - **Native Performance**: Built with Vanilla JS/CSS for zero-latency interactions.
- **Offline First**: Works entirely offline, no servers or data collection.
- **SEO Ready**: Optimized metadata, Open Graph tags, and custom favicon assets for high quality web presence.

## 🛠 Tech Stack

- **Language**: TypeScript
- **Core Engine**: `lunar-javascript` for high-precision math
- **Styling**: Vanilla CSS3 (Custom Design System)
- **Bundler**: `esbuild` for ultra-fast UI bundling
- **Environment**: Node.js
- **Testing**: `Vitest` for domain logic and fortune data verification

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
git clone https://github.com/ndanhit/am-lich.git
cd am-lich
npm install
```

### Development
Starts a development server with automatic esbuild bundling.
```bash
npm run dev
```

### Build
Type-checks the source and generates the production UI bundle.
```bash
npm run build
```

### Testing
Verify the lunar conversion and fortune data extraction.
```bash
npm run test
```

## 🌍 Deployment

This project is optimized for **Vercel**:
- Handled via `vercel.json` configuration.
- Serves directly from the root with pre-built assets in `dist/`.

## 📄 License
ISC

---
Designed with ❤️ for the Vietnamese community. 🌙