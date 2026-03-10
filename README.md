# 🦈 Shark OS

<div align="center">
  <img src="https://img.shields.io/badge/version-15.14-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/Next.js-15-black.svg" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-blue.svg" alt="React">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
</div>

**Shark OS** es un sistema operativo web completo que funciona 100% en tu navegador. Accede a tus archivos, apps y herramientas desde cualquier dispositivo, sin servidor, sin costo.

## ✨ Características

### 🖥️ Experiencia de Escritorio Completa
- **BIOS Boot** - Experiencia de arranque realista
- **Splash Screen** - Animación de carga del sistema
- **Lock Screen** - Pantalla de bloqueo con PIN
- **Desktop** - Interfaz moderna con glassmorphism
- **Dock** - Barra de tareas estilo macOS

### 📱 20+ Aplicaciones Integradas
| App | Descripción |
|-----|-------------|
| **Terminal** | Shell completo con temas y Matrix mode |
| **Explorer** | Gestor de archivos con soporte USB/OTG |
| **Studio** | IDE de desarrollo integrado |
| **Notepad** | Editor de texto |
| **Calculator** | Calculadora científica |
| **Paint** | Herramienta de dibujo |
| **Music** | Reproductor de música |
| **Videos** | Reproductor de video |
| **Camera** | Captura de fotos/video |
| **Gallery** | Visor de imágenes |
| **Weather** | Información del clima |
| **News** | Lector de noticias |
| **Monitor** | Monitor del sistema |
| **Backup** | Exportar/importar datos |
| **Settings** | Configuración del sistema |
| **Store** | Tienda de aplicaciones |
| **Replicator** | Sincronización Git |
| **Nexus Flux** | Herramientas avanzadas |

### 🔐 Seguridad y Privacidad
- **Vault Encriptado** - Almacenamiento seguro con OPFS + PIN
- **100% Client-Side** - Tus datos nunca salen de tu dispositivo
- **Sin Tracking** - Sin telemetría ni analytics invasivos
- **Código Abierto** - Auditoría transparente

### 💾 Sistema de Archivos Virtual (VFS)
- **IndexedDB** - Almacenamiento persistente
- **OPFS** - Origin Private File System encriptado
- **Memory** - Almacenamiento temporal
- **Native FS** - Acceso a USB/OTG (Chrome/Edge)

## 🚀 Deployment

### Render (Gratuito)
1. Fork este repositorio
2. Ve a [Render.com](https://render.com)
3. New → Web Service → Connect tu repo
4. Plan: **Free**
5. Build Command: `bun install && bun run build`
6. Start Command: `NODE_ENV=production bun .next/standalone/server.js`

### Desarrollo Local
```bash
bun install
bun run dev
```

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15 + React 19
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **UI**: shadcn/ui + lucide-react
- **Estado**: Zustand + React hooks
- **Kernel**: Custom TS kernel con scheduler

## 🆚 vs Puter.com

| Característica | Puter | Shark OS |
|---------------|-------|----------|
| BIOS Boot Realista | ❌ | ✅ |
| Vault Encriptado | ❌ | ✅ OPFS + PIN |
| Soporte USB/OTG | ❌ | ✅ Native FS API |
| Terminal Matrix Mode | ❌ | ✅ |
| Modo Offline PWA | Limitado | ✅ Completo |
| Stack Moderno | jQuery | Next.js 15 |
| Costo Infraestructura | Servidor | $0 (CDN) |

## 📄 Licencia

MIT License - Úsalo libremente para cualquier propósito.

---

<div align="center">
  <strong>🦈 Shark OS - Tu escritorio en la nube, gratis para siempre.</strong>
</div>

🚀 Live Demo

⚠️ Note: The current live demo is running an older stable version.
The latest version is available in this repository.
A new demo will be deployed soon.
