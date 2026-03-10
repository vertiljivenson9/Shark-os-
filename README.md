<p align="center">
  <img src="public/logo.svg" alt="Shark OS Logo" width="200">
</p>

<h1 align="center">Shark OS</h1>

<p align="center">
  <strong>A privacy-first, web-based operating system that runs 100% in your browser</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-15.13-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/Next.js-16-black.svg" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-blue.svg" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/Cloudflare-Pages-orange.svg" alt="Cloudflare Pages">
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-apps">Apps</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-local-development">Local Development</a> •
  <a href="#-tech-stack">Tech Stack</a>
</p>

---

## 🦈 About

**Shark OS** is a complete web-based operating system that runs entirely in your browser. Access your files, apps, and tools from any device with zero server costs and complete privacy.

> 🔥 **Goal**: Build a WebOS that surpasses [Puter.com](https://puter.com) in features, privacy, and user experience.

---

## ✨ Features

### 🖥️ Complete Desktop Experience
| Feature | Description |
|---------|-------------|
| **BIOS Boot** | Realistic BIOS POST sequence with hardware detection |
| **Splash Screen** | Animated system loading with progress |
| **Lock Screen** | PIN-protected lock screen with wallpaper |
| **Desktop** | Modern glassmorphism UI with grid layout |
| **Dock** | macOS-style taskbar with active window indicators |
| **Control Center** | Quick settings, notifications, and system controls |
| **Toast Notifications** | Animated system notifications |
| **Sound System** | 30+ procedural UI sound effects |

### 📱 Mobile & Desktop Responsive
- **Desktop**: Full grid layout with draggable windows
- **Mobile**: Touch-optimized with app drawer and swipe gestures
- **Tablet**: Adaptive layout with resize support

### 🔐 Security & Privacy
| Feature | Technology |
|---------|------------|
| **Encrypted Vault** | OPFS + PIN protection |
| **100% Client-Side** | Your data never leaves your device |
| **No Tracking** | Zero telemetry or invasive analytics |
| **Open Source** | Transparent, auditable code |

### 💾 Virtual File System (VFS)
- **IndexedDB** - Persistent storage backend
- **OPFS** - Origin Private File System (encrypted)
- **Memory** - Temporary RAM storage
- **Native FS** - USB/OTG access via File System Access API

### 🧠 Advanced Kernel Features
- **Process Manager** - PID tracking, priority scheduling
- **Event Bus** - System-wide event communication
- **Kernel Logger** - Centralized logging system
- **Snapshot Manager** - Save/restore system state
- **Runtime Manager** - Python/Node/Lua runtime support (simulated)
- **AI Service** - Integrated AI assistant (GLM-4.7)

---

## 📱 Apps

Shark OS includes **21+ built-in applications**:

| App | Icon | Description |
|-----|------|-------------|
| **Terminal** | 🖥️ | Full shell with 50+ commands, Matrix mode, themes |
| **Explorer** | 📁 | File manager with USB/OTG support |
| **DevTools** | 🔧 | SDK, code editor, build system, publish to store |
| **Studio** | 💻 | Full IDE with syntax highlighting |
| **Monitor** | 📊 | System monitor with real-time graphs |
| **Paint** | 🎨 | Drawing tool with 9 tools, layers support |
| **Notepad** | 📝 | Text editor with syntax support |
| **Calculator** | 🔢 | Scientific calculator |
| **Camera** | 📷 | Photo/video capture |
| **Gallery** | 🖼️ | Image viewer with slideshow |
| **Music** | 🎵 | Audio player with visualizer |
| **Videos** | 🎬 | Video player with subtitles |
| **Weather** | ☀️ | Weather information |
| **News** | 📰 | RSS news reader |
| **Store** | 🛒 | App store for extensions |
| **Settings** | ⚙️ | System configuration |
| **Backup** | 💾 | Export/import system data |
| **Replicator** | ⚡ | Git synchronization tool |
| **Nexus** | 🔮 | Advanced tools suite |
| **Clock** | 🕐 | World clock and alarms |
| **Timeline** | 📅 | Activity history |

---

## 🚀 Deployment

### ☁️ Cloudflare Pages (Recommended - Free)

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://dash.cloudflare.com/?to=/:account/pages/new)

#### Method 1: Dashboard (Easiest)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **Workers & Pages** → **Create application** → **Pages**
3. Click **Connect to Git**
4. Select **GitHub** and authorize
5. Find repository: `vertiljivenson9/Shark-os-`
6. Configure build:

| Setting | Value |
|---------|-------|
| Framework preset | Next.js |
| Build command | `bun run build` |
| Build output directory | `out` |
| Root directory | `/` |

7. Click **Save and Deploy**

#### Method 2: Wrangler CLI

```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the project
bun run build

# Deploy
wrangler pages deploy out --project-name=shark-os
```

#### Your URLs after deployment:
- **Cloudflare URL**: `https://shark-os.pages.dev`
- **Custom Domain**: Add in Settings → Custom domains

### 🔄 Auto-Deploy

Every time you push to `main`, Cloudflare automatically:
1. Detects changes
2. Rebuilds the project
3. Deploys the new version

---

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/vertiljivenson9/Shark-os-.git
cd Shark-os-

# Install dependencies
bun install

# Start development server
bun run dev

# Open http://localhost:3000
```

### Build for Production

```bash
# Build static site
bun run build

# Output in ./out folder
```

---

## 🏗️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **UI Library** | React 19 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Components** | shadcn/ui, Radix UI |
| **Icons** | Lucide React |
| **State** | Zustand, React hooks |
| **Audio** | Web Audio API (procedural sounds) |
| **Storage** | IndexedDB, OPFS, VFS |
| **Kernel** | Custom TS kernel with scheduler |

---

## 🆚 Comparison: Shark OS vs Puter.com

| Feature | Puter | Shark OS |
|---------|-------|----------|
| Realistic BIOS Boot | ❌ | ✅ |
| Encrypted Vault (OPFS + PIN) | ❌ | ✅ |
| USB/OTG Support | ❌ | ✅ Native FS API |
| Terminal Matrix Mode | ❌ | ✅ |
| Offline PWA Mode | Limited | ✅ Full |
| Modern Stack | jQuery | Next.js 16 + React 19 |
| Sound System | ❌ | ✅ 30+ procedural sounds |
| DevTools SDK | ❌ | ✅ Build & publish apps |
| Infrastructure Cost | Server Required | **$0** (CDN only) |
| Open Source | Partial | ✅ Fully open |

---

## 📁 Project Structure

```
shark-os/
├── public/               # Static assets
│   └── logo.svg          # Shark OS logo
├── src/
│   ├── app/              # Next.js app router
│   │   └── page.tsx      # Entry point
│   └── shark-os/         # Main OS code
│       ├── SharkOSApp.tsx    # Main component
│       ├── apps/             # Built-in apps
│       ├── components/       # UI components
│       ├── services/         # Core services
│       │   ├── kernel.ts     # OS kernel
│       │   ├── vfs/          # Virtual file system
│       │   └── media/        # Audio/sound system
│       └── types.ts          # TypeScript types
├── next.config.ts        # Next.js config (export mode)
├── package.json          # Dependencies
└── CLOUDFLARE_DEPLOY.md  # Detailed deployment guide
```

---

## 🎯 Roadmap

- [ ] PWA with offline support
- [ ] Multi-window drag & drop
- [ ] App marketplace with user submissions
- [ ] AI assistant integration
- [ ] Collaborative documents
- [ ] WebRTC video calls
- [ ] Blockchain wallet integration

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

MIT License - Use freely for any purpose.

---

<p align="center">
  <strong>🦈 Shark OS - Your desktop in the cloud, free forever.</strong>
</p>

<p align="center">
  Made with ❤️ by the Shark OS Team
</p>
