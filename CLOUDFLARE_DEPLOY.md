# 🦈 Desplegar Shark OS en Cloudflare Pages

## Repositorio
- **GitHub:** https://github.com/vertiljivenson9/Shark-os-

---

## 📋 Paso 1: Preparar el Proyecto para Cloudflare

Cloudflare Pages requiere `next.config.ts` con `output: 'export'` para sitios estáticos.

### Opción A: Despliegue Estático (Recomendado)

1. Modifica `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
```

2. Construye el proyecto:
```bash
bun run build
```

3. El output estará en la carpeta `out/`

---

## 🚀 Paso 2: Desplegar en Cloudflare Pages

### Método 1: Desde Dashboard de Cloudflare (Más Fácil)

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click en **Workers & Pages** → **Create application** → **Pages**
3. Click en **Connect to Git**
4. Selecciona **GitHub** y autoriza
5. Busca tu repositorio: `vertiljivenson9/Shark-os-`
6. Configura el build:
   - **Framework preset:** Next.js
   - **Build command:** `bun run build`
   - **Build output directory:** `out`
   - **Root directory:** `/`

7. Click en **Save and Deploy**

### Método 2: Via Wrangler CLI

```bash
# Instalar wrangler
npm install -g wrangler

# Login a Cloudflare
wrangler login

# Construir el proyecto
cd /home/z/my-project
bun run build

# Desplegar
wrangler pages deploy out --project-name=shark-os
```

---

## ⚙️ Configuración para Next.js en Cloudflare

### Crear `wrangler.toml`:

```toml
name = "shark-os"
compatibility_date = "2024-01-01"
pages_build_output_dir = "out"

[site]
bucket = "./out"
```

---

## 🔧 Modificar next.config.ts para Cloudflare

Abre `next.config.ts` y cámbialo a:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  assetPrefix: '/',
  basePath: '',
};

export default nextConfig;
```

---

## 📁 Estructura de Archivos para Deploy

```
shark-os/
├── src/
│   ├── app/
│   │   └── page.tsx
│   └── shark-os/
│       ├── SharkOSApp.tsx
│       ├── apps/
│       └── services/
├── public/
├── next.config.ts      ← Modificar para output: 'export'
├── package.json
└── wrangler.toml       ← Crear para Cloudflare
```

---

## 🌐 URLs después del Deploy

Una vez desplegado, tu Shark OS estará disponible en:

- **URL de Cloudflare:** `https://shark-os.pages.dev`
- **Custom Domain:** Puedes agregar tu propio dominio en Settings → Custom domains

---

## 🔄 Actualizaciones Automáticas

Cada vez que hagas `git push` a la rama `main`, Cloudflare automáticamente:
1. Detectará los cambios
2. Reconstruirá el proyecto
3. Desplegará la nueva versión

---

## 🐛 Troubleshooting

### Error: "output: 'export' no soporta features X"

Algunas features de Next.js no funcionan con export estático:
- API Routes (necesitas Cloudflare Workers)
- Server-side rendering
- Image Optimization API

### Solución: Usar Cloudflare Workers + Pages

Para funcionalidad completa (API routes, etc.), usa **Cloudflare Workers**:

```bash
# Crear función serverless
wrangler pages functions build
```

---

## 📊 Ventajas de Cloudflare Pages

| Característica | Cloudflare Pages |
|----------------|------------------|
| CDN Global | ✅ 300+ ubicaciones |
| SSL Gratuito | ✅ Automático |
| Dominio Custom | ✅ Gratis |
| Builds Ilimitados | ✅ 500/mes gratis |
| Ancho de Banda | ✅ Ilimitado |
| Velocidad | ✅ Edge caching |

---

## 🎯 Quick Deploy Commands

```bash
# 1. Modificar config para export
# (Editar next.config.ts)

# 2. Build
bun run build

# 3. Deploy con wrangler
wrangler pages deploy out --project-name=shark-os

# O conectar GitHub en dashboard de Cloudflare
```

---

## ✅ Tu repositorio está listo

Ya subimos todo el código a:
**https://github.com/vertiljivenson9/Shark-os-**

Solo necesitas:
1. Ir a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Workers & Pages → Create → Pages → Connect to Git
3. Seleccionar el repositorio
4. Configurar build y desplegar
