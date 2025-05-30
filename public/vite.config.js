import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    outDir: 'dist', // Output directory for 'npm run build:react'
    // sourcemap: true, // Useful for debugging production issues
  },

});
