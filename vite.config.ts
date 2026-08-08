import { defineConfig, loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export default defineConfig(async ({ mode }) => {
  const plugins: PluginOption[] = [react(), tailwindcss()];
  try {
    // Optional Design Arena source-location plugin (no types shipped).
    const m = require('./.vite-source-tags.js') as {
      sourceTags?: () => PluginOption;
    };
    if (typeof m.sourceTags === 'function') {
      plugins.push(m.sourceTags());
    }
  } catch {
    /* source-tags plugin is optional */
  }

  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_']);
  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
  }

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'firebase';
              if (id.includes('swiper')) return 'swiper';
              if (
                id.includes('react-dom') ||
                id.includes('react-router') ||
                id.includes('/react/')
              ) {
                return 'vendor';
              }
              if (id.includes('framer-motion')) return 'motion';
              // Do NOT bucket lucide-react — let Vite tree-shake per-route icons.
            }
          },
        },
      },
    },
  };
})
