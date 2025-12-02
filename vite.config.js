import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('firebase/firestore')) return 'firebase-firestore';
          if (id.includes('firebase/auth')) return 'firebase-auth';
          if (id.includes('firebase/app')) return 'firebase-core';
          return undefined;
        }
      }
    }
  }
})
