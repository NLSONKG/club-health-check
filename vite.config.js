import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/analyze': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => '/v1/messages',
          configure: (proxy) => {
            const apiKey = env.VITE_ANTHROPIC_API_KEY;
            console.log('[Proxy] API key:', apiKey ? apiKey.substring(0, 20) + '...' : 'MISSING');
            proxy.on('proxyReq', (proxyReq) => {
              if (apiKey) {
                proxyReq.setHeader('x-api-key', apiKey);
                proxyReq.setHeader('anthropic-version', '2023-06-01');
              }
            });
          },
        }
      }
    }
  }
})
