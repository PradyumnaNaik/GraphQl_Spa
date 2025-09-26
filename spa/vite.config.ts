import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'mcd_spa',
      remotes: {
        // Webpack style remote: <global>@<url>/remoteEntry.js
        SharedModules: 'sharedModules@https://cleanui0011.github.io/mf-shared-modules/remoteEntry.js'
      },
      shared: [
        'react',
        'react-dom'
      ]
    })
  ],
  server: {
    port: 5173
  },
  build: {
    target: 'esnext',
    modulePreload: false,
    cssCodeSplit: true
  }
});
